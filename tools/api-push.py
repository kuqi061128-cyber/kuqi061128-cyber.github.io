# -*- coding: utf-8 -*-
""" ============================================================
 * 应急推送：github.com 被网络污染连不上时，走 api.github.com 推送
 *
 * 用法（在 my-site 目录，二选一）：
 *   python tools/api-push.py ghp_你的令牌
 *   $env:GH_TOKEN="ghp_你的令牌"; python tools/api-push.py   （PowerShell）
 *
 * 原理：把本地领先远程的全部改动（可跨多个本地提交），
 *       通过 GitHub Git Data API（建 blob → 建树 → 建提交 → 移动 main 指针）
 *       合成一个远程提交写入。
 * 限制：只支持文本文件（本站代码/文档全是文本）；推送后本地与
 * 远程提交历史不同源，等 github.com 恢复后跑一次
 * git pull --rebase && git push 即可恢复正常同步。
 * ============================================================ """
import io, json, os, subprocess, sys, urllib.request

def main():
    token = (os.environ.get("GH_TOKEN") or
             (sys.argv[1].strip() if len(sys.argv) > 1 else ""))
    if not token:
        sys.exit("用法: python tools/api-push.py ghp_你的令牌  或设置环境变量 GH_TOKEN")
    api = "https://api.github.com/repos/kuqi061128-cyber/kuqi061128-cyber.github.io"
    hdr = {"Authorization": "Bearer " + token,
           "Accept": "application/vnd.github+json", "User-Agent": "api-push"}

    def call(method, path, body=None):
        req = urllib.request.Request(api + path, method=method, headers=hdr,
                                     data=json.dumps(body).encode() if body else None)
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read() or b"{}")

    local = subprocess.run(["git", "rev-parse", "HEAD"], encoding="utf-8",
                           capture_output=True, text=True).stdout.strip()
    msg = subprocess.run(["git", "log", "-1", "--format=%B"], encoding="utf-8",
                         capture_output=True, text=True).stdout.strip()
    remote_sha = call("GET", "/git/ref/heads/main")["object"]["sha"]
    # 关键：取「基准..本地」全部差异文件（覆盖多个未推送的本地提交）
    # 默认基准=远程指针（本地历史的祖先）；API 合成推送造成历史分叉后，
    # 可用 DIFF_BASE 指定本地仍存在的旧提交 sha 来算差异
    base_for_diff = os.environ.get("DIFF_BASE") or remote_sha
    # --name-status 输出形如 "M\tindex.html" / "D\tplugins/like.js"，
    # 用状态区分修改/新增（需上传内容）与删除（tree 条目 sha=null 即可）
    raw_diff = subprocess.run(
        ["git", "diff-tree", "--no-commit-id", "--name-status", "-r", base_for_diff, local],
        encoding="utf-8", capture_output=True, text=True).stdout
    diffs = [ln.split("\t", 1) for ln in raw_diff.splitlines() if "\t" in ln]
    if not diffs:
        sys.exit("本地没有待推送的改动")
    print("远程:", remote_sha[:7], "| 本地:", local[:7], "| 文件数:", len(diffs))

    entries = []
    for status, p in diffs:
        if status == "D":   # 删除：tree 条目 sha=null，无需读文件
            entries.append({"path": p, "mode": "100644", "type": "blob", "sha": None})
            print("  delete:", p)
            continue
        raw = open(p, "rb").read()
        try:
            # 文本文件按 UTF-8 上传
            content = raw.decode("utf-8")
            body = {"content": content, "encoding": "utf-8"}
        except UnicodeDecodeError:
            # 二进制文件（图片/图标等）走 base64
            import base64
            body = {"content": base64.b64encode(raw).decode("ascii"), "encoding": "base64"}
        sha = call("POST", "/git/blobs", body)["sha"]
        entries.append({"path": p, "mode": "100644", "type": "blob", "sha": sha})
        print("  blob:", p)

    base = call("GET", "/git/commits/" + remote_sha)["tree"]["sha"]
    tree = call("POST", "/git/trees", {"base_tree": base, "tree": entries})["sha"]
    commit = call("POST", "/git/commits",
                  {"message": msg, "tree": tree, "parents": [remote_sha]})["sha"]
    call("PATCH", "/git/refs/heads/main", {"sha": commit, "force": False})
    print("API 推送成功:", commit[:7])
    print("提醒: 本地与远程历史已不同源，网络恢复后执行 git pull --rebase && git push 归位")

if __name__ == "__main__":
    main()

