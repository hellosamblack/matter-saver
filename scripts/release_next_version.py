#!/usr/bin/env python3
"""Release the next Matter Saver version."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "custom_components" / "matter_saver" / "manifest.json"


def _run_command(
    command: list[str],
    *,
    capture_output: bool = False,
    input_text: str | None = None,
) -> subprocess.CompletedProcess[str]:
    """Run a command from the repository root."""
    return subprocess.run(
        command,
        cwd=ROOT,
        check=True,
        text=True,
        input=input_text,
        capture_output=capture_output,
    )


def _command_exists(command: str) -> bool:
    """Return True when the command exists on PATH."""
    from shutil import which

    return which(command) is not None


def _github_repo() -> str:
    """Return the GitHub owner/repo for the origin remote."""
    result = _run_command(
        ["git", "remote", "get-url", "origin"],
        capture_output=True,
    )
    remote_url = result.stdout.strip()
    match = re.search(
        r"github\.com[:/](?P<repo>[^/\s]+/[^/\s]+?)(?:\.git)?$",
        remote_url,
    )
    if not match:
        raise SystemExit(
            "Release aborted: could not determine the GitHub repository from the origin remote."
        )
    return match.group("repo")


def _require_github_release_access(repo: str) -> None:
    """Ensure GitHub CLI can access the release target repository."""
    try:
        _run_command(["gh", "auth", "status"])
        _run_command(["gh", "repo", "view", repo, "--json", "nameWithOwner"])
    except subprocess.CalledProcessError as exc:
        raise SystemExit(
            f"Release aborted: GitHub CLI cannot access {repo}. "
            "Run `gh auth login` if needed and verify the repository is reachable."
        ) from exc


def _load_manifest() -> dict[str, object]:
    """Load the integration manifest."""
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def _write_manifest(manifest: dict[str, object]) -> None:
    """Write the integration manifest with stable formatting."""
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )


def _require_clean_worktree() -> None:
    """Ensure the git working tree is clean before releasing."""
    status = _run_command(["git", "status", "--porcelain"], capture_output=True)
    if status.stdout.strip():
        raise SystemExit(
            "Release aborted: git working tree is not clean. Commit or stash changes first."
        )


def _current_branch() -> str:
    """Return the current branch name."""
    result = _run_command(["git", "branch", "--show-current"], capture_output=True)
    branch = result.stdout.strip()
    if not branch:
        raise SystemExit("Release aborted: detached HEAD is not supported.")
    return branch


def _parse_version(version: str) -> tuple[int, int, int]:
    """Parse a semantic version of the form X.Y.Z."""
    parts = version.split(".")
    if len(parts) != 3 or not all(part.isdigit() for part in parts):
        raise ValueError(f"Unsupported version format: {version}")
    return tuple(int(part) for part in parts)


def _next_version(current_version: str, bump: str, custom_version: str | None) -> str:
    """Return the next release version."""
    if bump == "custom":
        if not custom_version:
            raise SystemExit("Custom version selected but no version was provided.")
        _parse_version(custom_version)
        return custom_version

    major, minor, patch = _parse_version(current_version)
    if bump == "major":
        return f"{major + 1}.0.0"
    if bump == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def _prompt_bump() -> str:
    """Prompt the user for the desired version bump."""
    print("Select release type: [patch] minor major custom")
    bump = input("Release type: ").strip().lower() or "patch"
    if bump not in {"patch", "minor", "major", "custom"}:
        raise SystemExit(f"Unsupported release type: {bump}")
    return bump


def _prompt_custom_version() -> str | None:
    """Prompt for a custom version when needed."""
    custom_version = input("Custom version (X.Y.Z): ").strip()
    return custom_version or None


def _prompt_release_notes(version: str) -> str:
    """Prompt the user for multiline release notes."""
    print(f"Enter release notes for v{version}.")
    print("Finish with a single '.' on its own line.")
    lines: list[str] = []
    while True:
        line = input()
        if line == ".":
            break
        lines.append(line)

    notes = "\n".join(lines).strip()
    if not notes:
        raise SystemExit("Release aborted: release notes are required.")
    return notes


def _create_release(version: str, notes: str, repo: str, *, dry_run: bool) -> None:
    """Commit, tag, push, and create the GitHub release."""
    tag = f"v{version}"
    branch = _current_branch()
    manifest_relpath = MANIFEST_PATH.relative_to(ROOT).as_posix()

    if dry_run:
        print(f"[dry-run] Would commit {manifest_relpath} with message: Release {tag}")
        print(f"[dry-run] Would tag: {tag}")
        print(f"[dry-run] Would push branch: {branch}")
        print(f"[dry-run] Would create GitHub release for {tag} in {repo}")
        return

    _run_command(["git", "add", manifest_relpath])
    _run_command(["git", "commit", "-m", f"Release {tag}"])
    _run_command(["git", "tag", tag])
    _run_command(["git", "push", "origin", branch])
    _run_command(["git", "push", "origin", tag])

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
        handle.write(notes)
        notes_path = Path(handle.name)

    try:
        _run_command(
            [
                "gh",
                "release",
                "create",
                tag,
                "--repo",
                repo,
                "--title",
                tag,
                "--notes-file",
                str(notes_path),
            ]
        )
    finally:
        notes_path.unlink(missing_ok=True)


def main() -> int:
    """Release the next version of Matter Saver."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--bump",
        choices=["patch", "minor", "major", "custom"],
        help="Version bump to release. Prompts when omitted.",
    )
    parser.add_argument(
        "--version",
        help="Custom version to release when --bump=custom.",
    )
    parser.add_argument(
        "--notes",
        help="Release notes. Prompts interactively when omitted.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview the release steps without changing git or GitHub.",
    )
    parser.add_argument(
        "--allow-dirty",
        action="store_true",
        help="Skip the clean worktree requirement. Useful for local dry-runs only.",
    )
    args = parser.parse_args()

    if not _command_exists("git"):
        raise SystemExit("Release aborted: git is required.")
    if not args.dry_run and not _command_exists("gh"):
        raise SystemExit("Release aborted: GitHub CLI (gh) is required.")

    repo = _github_repo()
    if not args.dry_run:
        _require_github_release_access(repo)

    if not args.allow_dirty:
        _require_clean_worktree()

    manifest = _load_manifest()
    current_version = manifest.get("version")
    if not isinstance(current_version, str) or not current_version:
        raise SystemExit("Release aborted: manifest version is missing.")

    bump = args.bump or _prompt_bump()
    custom_version = args.version
    if bump == "custom" and custom_version is None:
        custom_version = _prompt_custom_version()

    next_version = _next_version(current_version, bump, custom_version)
    notes = args.notes or _prompt_release_notes(next_version)

    print(f"Current version: {current_version}")
    print(f"Next version: {next_version}")

    manifest["version"] = next_version
    _write_manifest(manifest)

    try:
        _create_release(next_version, notes, repo, dry_run=args.dry_run)
    except subprocess.CalledProcessError as exc:
        if args.dry_run:
            manifest["version"] = current_version
            _write_manifest(manifest)
        tag = f"v{next_version}"
        raise SystemExit(
            f"Release aborted while finalizing {tag}. "
            "The manifest change, git commit, or tag may already exist. "
            f"If needed, finish the GitHub release manually for {tag} in {repo}."
        ) from exc
    except Exception:
        if args.dry_run:
            manifest["version"] = current_version
            _write_manifest(manifest)
        raise

    if args.dry_run:
        manifest["version"] = current_version
        _write_manifest(manifest)
        print("[dry-run] Manifest restored to original version.")
    else:
        print(f"Release complete: v{next_version}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nRelease aborted.", file=sys.stderr)
        raise SystemExit(130)