# Arch User Repository (AUR) Publishing Guide

This directory contains the `PKGBUILD` template for packaging **InkBook** for Arch Linux and AUR users.

---

## 1. Prerequisites

1. An account on the [Arch User Repository (AUR)](https://aur.archlinux.org/).
2. Your SSH public key added to your AUR profile (`~/.ssh/id_ed25519.pub`).
3. Base development tools on Arch Linux:
   ```bash
   sudo pacman -S --needed base-devel git namcap
   ```

---

## 2. Initial Setup (First Submission)

1. Clone the AUR repository:
   ```bash
   git clone ssh://aur@aur.archlinux.org/inkbook.git
   cd inkbook
   ```
2. Copy `PKGBUILD` from this directory into the cloned repo.

---

## 3. Updating and Releasing

When a new release tag (e.g. `v0.1.0`) is published to GitHub:

1. Update `pkgver` in `PKGBUILD`:
   ```bash
   pkgver=0.1.0
   pkgrel=1
   ```
2. Download and compute the SHA256 checksum automatically:
   ```bash
   updpkgsums
   ```
3. Generate the required `.SRCINFO` metadata file:
   ```bash
   makepkg --printsrcinfo > .SRCINFO
   ```
4. Verify the package builds cleanly in a local directory:
   ```bash
   makepkg -sric
   ```
5. Run `namcap` static analysis to check for packaging standards and policy violations:
   ```bash
   namcap PKGBUILD
   namcap inkbook-*.pkg.tar.zst
   ```
6. Commit and push both `PKGBUILD` and `.SRCINFO` to AUR:
   ```bash
   git add PKGBUILD .SRCINFO
   git commit -m "feat: release v0.1.0"
   git push origin master
   ```

Users can then install InkBook using any AUR helper:

```bash
paru -S inkbook
# or
yay -S inkbook
```
