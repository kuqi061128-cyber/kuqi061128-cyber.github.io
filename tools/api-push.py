# -*- coding: utf-8 -*-
""" ============================================================
 * 应急推送：github.com 被网络污染连不上时，走 api.github.com 推送
 *
 * 用法（在 my-site 目录）：
 *   python tools/api-push.py ghp_你的令牌
 *
 * 原理：把本地领先远程的提交内容，通过 GitHub Git Data API
 * （建 blob → 建树 → 建提交 → 移动 main 指针）写到远程。
 * 限制：只支持文本文件（本站代码/文档全是文本）；推送后本地与
 * 远程提交历史不同源，等 github.com 恢复后跑一次
 * git pull --rebase && git push 即可恢复正常同步。
 * ============================================================ """
import io, json, subprocess, sys, urllib.request

def main():
    if len(sys.argv) < 2:
        sys.exit("用法: python tools/api-push.py ghp_你的令牌")
    token = sys.argv[1].strip()
    api = "https://api.github.com/repos/kuqi061128-cyber/kuqi061128-cyber.github.io"
    hdr = {"Authorization": "Bearer " + token,
           "Accept": "application/vnd.github+json", "User-Agent": "api-push"}

    def call(method, path, body=None):
        req = urllib.request.Request(api + path, method=method, headers=hdr,
                                     data=json.dumps(body).encode() if body else None)
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read() or b"{}")

    local = subprocess.run(["git", "rev-parse", "HEAD"],
                           capture_output=True, text=True).stdout.strip()
    msg = subprocess.run(["git", "log", "-1", "--format=%B"],
                         capture_output=True, text=True).stdout.strip()
    remote_sha = call("GET", "/git/ref/heads/main")["object"]["sha"]
    files = subprocess.run(["git", "diff-tree", "--no-commit-id", "--name-only", "-r", local],
                           capture_output=True, text=True).stdout.split()
    if not files:
        sys.exit("本地没有待推送的改动")
    print("远程:", remote_sha[:7], "| 本地:", local[:7], "| 文件数:", len(files))

    entries = []
    for p in files:
        content = io.open(p, encoding="utf-8").read()
        sha = call("POST", "/git/blobs", {"content": content, "encoding": "utf-8"})["sha"]
        entries.append({"path": p, "mode": "100644", "type": "blob", "sha": sha})
        print("  blob:", p)

    base = call("GET", "/git/commits/" + remote_sha)["tree"]["sha"]
    tree = call("POST", "/git/trees", {"base_tree": base, "tree": entries})["sha"]
    commit = call("POST", "/git/commits",
                  {"message": msg, "tree": tree, "parents": [remote_sha]})["sha"]
    call("PATCH", "/git/refs/heads/main", {"sha": commit, "force": False})
    print("API 推送成功:", commit[:7])

if __name__ == "__main__":
    main()
