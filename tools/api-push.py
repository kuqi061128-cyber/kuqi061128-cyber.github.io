# -*- coding: utf-8 -*-
""" ============================================================
 * 应急推送：github.com 被网络污染连不上时，走 api.github.com 推送
 *
 * 用法（在 my-site 目录，二选一）：
 *   python tools/api-push.py ghp_你的令牌
 *   $env:GH_TOKEN="ghp_你的令牌"; python tools/api-push.py   （PowerShell）
 *
 * 原理（v2，2026-09-13 重写）：不再依赖 git 历史，直接比对**文件树**——
 *   1. 拉远程 main 的 tree（recursive），得到每个文件的 sha；
 *   2. 本地 git ls-tree -r HEAD 得到同结构的清单；
 *   3. 内容不同/新增的 → 建 blob 上传；远程有本地没有的 → 置 sha=null 删除；
 *   4. base_tree=远程 tree 建新 tree → 建 commit（父=远程指针）→ 移动 main 指针。
 *   这样无论本地历史是否与远程分叉都能正确推送，也支持图片等二进制文件。
 *
 * 为什么重写：旧版用 `git diff-tree 远程sha 本地sha` 算差异，而 API 合成推送
 * 产生的远程 commit 在本地并不存在，git 报 bad object 且 stdout 为空，
 * 脚本会误报「本地没有待推送的改动」而静默不推（2026-09-13 实际踩到）。
 *
 * 限制：单文件需 < 30MB（GitHub blob 上限），超过会报错中止。
 * 推送后本地与远程历史不同源，网络恢复后跑一次 git pull --rebase && git push 归位。
 * ============================================================ """
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

REPO = "kuqi061128-cyber/kuqi061128-cyber.github.io"
API = "https://api.github.com/repos/" + REPO
MAX_BYTES = 30 * 1024 * 1024


def main():
    token = (os.environ.get("GH_TOKEN") or
             (sys.argv[1].strip() if len(sys.argv) > 1 else ""))
    if not token:
        sys.exit("用法: python tools/api-push.py ghp_你的令牌  或设置环境变量 GH_TOKEN")

    hdr = {"Authorization": "Bearer " + token,
           "Accept": "application/vnd.github+json", "User-Agent": "api-push"}

    def call(method, path, body=None):
        req = urllib.request.Request(API + path, method=method, headers=hdr,
                                     data=json.dumps(body).encode() if body else None)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:300]
            sys.exit("GitHub API 出错 %s %s -> %s %s" % (method, path, e.code, detail))

    def git(*args):
        return subprocess.run(["git"] + list(args), encoding="utf-8",
                              capture_output=True, text=True).stdout

    # ---------- 本地状态 ----------
    local_head = git("rev-parse", "HEAD").strip()
    msg = git("log", "-1", "--format=%B").strip()
    if not local_head:
        sys.exit("当前目录不是 git 仓库")

    local = {}   # path -> (mode, sha)
    for rec in git("ls-tree", "-r", "-z", "HEAD").split("\0"):
        if not rec.strip():
            continue
        meta, path = rec.split("\t", 1)
        parts = meta.split()
        local[path] = (parts[0], parts[2])

    # ---------- 远程状态 ----------
    ref = call("GET", "/git/ref/heads/main")
    remote_sha = ref["object"]["sha"]
    remote_tree_sha = call("GET", "/git/commits/" + remote_sha)["tree"]["sha"]
    tree = call("GET", "/git/trees/" + remote_tree_sha + "?recursive=1")
    if tree.get("truncated"):
        sys.exit("远程文件树过大被截断，请手动处理")
    remote = {e["path"]: e["sha"] for e in tree.get("tree", []) if e.get("type") == "blob"}

    print("远程:", remote_sha[:7], "| 本地:", local_head[:7])

    uploads = sorted(p for p in local if remote.get(p) != local[p][1])
    deletes = sorted(p for p in remote if p not in local)

    if not uploads and not deletes:
        sys.exit("本地与远程内容一致，无需推送")

    # ---------- 组装 tree ----------
    entries = []
    for p in uploads:
        full = os.path.join(os.getcwd(), p)
        if not os.path.isfile(full):
            sys.exit("文件缺失（工作区不干净？）: " + p)
        raw = open(full, "rb").read()
        if len(raw) > MAX_BYTES:
            sys.exit("文件过大（%.1fMB）: %s，请改用 GitHub Releases 托管"
                     % (len(raw) / 1048576.0, p))
        try:
            # 文本文件按 UTF-8 上传；并把 Windows 的 CRLF 归一成 LF，
            # 使远程 blob 与 git 仓库内容（core.autocrlf 存 LF）完全一致，
            # 否则每次比对都会显示"文件已变化"而重复上传。
            text = raw.decode("utf-8")
            body = {"content": text.replace("\r\n", "\n"), "encoding": "utf-8"}
        except UnicodeDecodeError:
            body = {"content": base64.b64encode(raw).decode("ascii"), "encoding": "base64"}
        sha = call("POST", "/git/blobs", body)["sha"]
        entries.append({"path": p, "mode": local[p][0], "type": "blob", "sha": sha})
        print("  ↑", p)

    for p in deletes:
        entries.append({"path": p, "mode": "100644", "type": "blob", "sha": None})
        print("  ✗ 删除", p)

    new_tree = call("POST", "/git/trees",
                    {"base_tree": remote_tree_sha, "tree": entries})["sha"]
    commit = call("POST", "/git/commits",
                  {"message": msg, "tree": new_tree, "parents": [remote_sha]})["sha"]
    call("PATCH", "/git/refs/heads/main", {"sha": commit, "force": False})

    print("推送成功: %s  （上传 %d 个，删除 %d 个）" % (commit[:7], len(uploads), len(deletes)))
    print("提醒: 本地与远程历史已不同源，网络恢复后执行 git pull --rebase && git push 归位")


if __name__ == "__main__":
    main()
