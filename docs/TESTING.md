# InkBook Linux Testing & Verification Guide

This guide details the verification procedures for the packaged Linux builds (**AppImage** and **pacman**), covering local testing on **Arch Linux** and cross-distribution verification using **Distrobox** and **Podman**.

---

## 1. Building the Release Packages

From the project root:

```bash
npm run package
```

The resulting artifacts are written to `dist/`:

- `dist/inkbook-1.0.0.AppImage` (portable executable image)
- `dist/inkbook-1.0.0.pacman` (native Arch Linux package)
- `dist/linux-unpacked/` (unpacked application directory)

---

## 2. Arch Linux Verification Checklist

> [!NOTE]
> Run all tests on your local Arch Linux desktop environment. Arch Linux uses `fuse3` by default; standard AppImages require the `fuse2` compatibility library.

### A. AppImage Testing

1. **Install FUSE2 compatibility library** (if not already installed):
   ```bash
   sudo pacman -S --needed fuse2
   ```
2. **Make the AppImage executable**:
   ```bash
   chmod +x dist/inkbook-1.0.0.AppImage
   ```
3. **Run the AppImage**:
   ```bash
   ./dist/inkbook-1.0.0.AppImage
   ```
   _Alternative without FUSE_: `./dist/inkbook-1.0.0.AppImage --appimage-extract-and-run`
4. **Verify Display Server Compatibility**:
   - **Wayland (Default)**: Under Hyprland, Sway, GNOME Wayland, or KDE Wayland, verify that InkBook opens natively with crisp HiDPI text and fractional scaling.
   - **X11 / XWayland**: Force X11 execution and verify:
     ```bash
     ./dist/inkbook-1.0.0.AppImage --ozone-platform=x11
     ```
5. **Verify File Argument Opening**:
   ```bash
   ./dist/inkbook-1.0.0.AppImage /path/to/sample.inkbook
   ```
   Verify that InkBook opens and displays the sample notebook directly.

---

### B. Pacman Package Testing

#### 1. Installation

Install the built package using `pacman -U`:

```bash
sudo pacman -U dist/inkbook-1.0.0.pacman
```

#### 2. Verification Steps

- [ ] **Application Launcher Entry**:
      Open your application launcher (Rofi, Wofi, GNOME App Grid, KDE Kickoff, or dmenu) and type `InkBook`. Confirm the application launcher entry displays the InkBook icon and description (`Handwritten digital notebook powered by Excalidraw`).
- [ ] **Binary Symlink**:
      Verify `/usr/bin/inkbook` is present in your PATH:
  ```bash
  which inkbook
  # Expected output: /usr/bin/inkbook
  ```
- [ ] **MIME Type Association**:
      Create a temporary notebook file:
  ```bash
  touch /tmp/test.inkbook
  ```
  Query the file type using `xdg-mime`:
  ```bash
  xdg-mime query filetype /tmp/test.inkbook
  # Expected output: application/x-inkbook
  ```
- [ ] **Default Application**:
      Verify InkBook is associated with the MIME type:
  ```bash
  xdg-mime query default application/x-inkbook
  # Expected output: inkbook.desktop
  ```
- [ ] **File Manager Double-Click**:
      In Dolphin, Nautilus, or Thunar, double-click `/tmp/test.inkbook`. Confirm InkBook launches and opens the file.
- [ ] **Security Checks**:
  - DevTools shortcuts (`F12`, `Ctrl+Shift+I`) are disabled.
  - External links click test (e.g. from Excalidraw link tool): validated external URLs open in your default browser via `xdg-open` / `shell.openExternal`.

#### 3. Uninstallation

Uninstall the package using `pacman -R`:

```bash
sudo pacman -R inkbook
```

#### 4. Removal Verification

Confirm complete removal:

```bash
which inkbook
# Expected: no inkbook in PATH

ls /usr/share/applications/inkbook.desktop
# Expected: No such file or directory

ls /usr/share/mime/packages/inkbook.xml
# Expected: No such file or directory
```

---

## 3. Cross-Distro Testing (Ubuntu & Fedora)

You can verify that the AppImage runs seamlessly on other distributions without installing virtual machines by using **Distrobox** (recommended for automatic Wayland/X11 socket forwarding) or **Podman**.

### Method 1: Using Distrobox (Recommended)

Install distrobox on Arch if needed:

```bash
sudo pacman -S --needed distrobox podman
```

#### A. Ubuntu 24.04 (Noble Numbat)

1. Create and enter the container:
   ```bash
   distrobox create --name ubuntu-test --image ubuntu:24.04
   distrobox enter ubuntu-test
   ```
2. Install required GUI and FUSE runtime libraries inside the container:
   ```bash
   sudo apt update && sudo apt install -y libfuse2 libglib2.0-0 libnss3 libatk1.0-0 libcups2 libgtk-3-0 libasound2t64
   ```
3. Run the InkBook AppImage (the host filesystem is mounted in `$HOME`):
   ```bash
   ~/Code/InkBook/dist/inkbook-1.0.0.AppImage
   ```
4. Verify application loads and closes cleanly, then exit:
   ```bash
   exit
   distrobox rm ubuntu-test
   ```

#### B. Fedora 40 / 41

1. Create and enter the container:
   ```bash
   distrobox create --name fedora-test --image fedora:40
   distrobox enter fedora-test
   ```
2. Install required dependencies inside the container:
   ```bash
   sudo dnf install -y fuse fuse-libs nss atk at-spi2-atk gtk3 alsa-lib libXScrnSaver
   ```
3. Run the InkBook AppImage:
   ```bash
   ~/Code/InkBook/dist/inkbook-1.0.0.AppImage
   ```
4. Verify application loads and closes cleanly, then exit:
   ```bash
   exit
   distrobox rm fedora-test
   ```

---

### Method 2: Using Raw Podman / Docker

To test execution without host GUI integration using Podman:

```bash
podman run --rm -it \
  -v "$PWD/dist:/dist:ro" \
  --device /dev/fuse:rwm \
  --cap-add SYS_ADMIN \
  --security-opt apparmor:unconfined \
  ubuntu:24.04 \
  bash -c "apt update && apt install -y libfuse2 libgtk-3-0 libnss3 && /dist/inkbook-1.0.0.AppImage --appimage-extract && ./squashfs-root/AppRun --version"
```
