# Jarvis AI OS

A full-stack, hacker-themed, multi-agent AI operating system built with React, Vite, Node.js, and live-build.

## Web Application Development

To run the web application locally for development:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## Creating a Bootable USB Pendrive

This repository is configured to automatically generate a bootable `.iso` file every time code is pushed to the `main` branch.

To get your bootable ISO:
1. Go to the **Actions** tab in this GitHub repository.
2. Click on the latest **Build Jarvis OS ISO** workflow run.
3. Scroll down to the **Artifacts** section and download the `jarvis-os-iso` file.
4. Use a tool like [Rufus](https://rufus.ie/) (on Windows) or [BalenaEtcher](https://etcher.balena.io/) (on Windows/Mac/Linux) to flash this ISO file onto your USB pendrive.
5. Plug the pendrive into a computer, reboot, and select the pendrive from the boot menu. The OS will automatically launch into the Jarvis UI in full-screen kiosk mode!

### How it works
The OS is built on Debian Linux. During the build process, it compiles this node.js/React application and creates systemd services to launch the backend, and configures Openbox window manager to automatically launch Chromium in kiosk mode pointing to the local Jarvis backend.
