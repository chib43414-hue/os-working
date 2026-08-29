#!/bin/bash

echo "Setting up live-build environment for Jarvis OS..."

# Clean up previous builds
lb clean

# Configure live-build
lb config \
    --architecture amd64 \
    --distribution bookworm \
    --archive-areas "main contrib non-free non-free-firmware" \
    --apt-indices false \
    --apt-recommends false \
    --debootstrap-options "--variant=minbase" \
    --firmware-binary true \
    --firmware-chroot true \
    --iso-application "Jarvis OS" \
    --iso-publisher "Jarvis AI" \
    --iso-volume "JARVIS_OS" \
    --mode debian \
    --system live

# Create directories for custom packages and scripts
mkdir -p config/package-lists
mkdir -p config/includes.chroot/opt/jarvis-os
mkdir -p config/includes.chroot/etc/systemd/system/
mkdir -p config/includes.chroot/usr/local/bin/

# Specify required packages for the OS
cat << 'PACKAGES' > config/package-lists/jarvis.list.chroot
linux-image-amd64
live-boot
live-config
live-config-systemd
systemd-sysv
network-manager
net-tools
curl
wget
git
sudo
ca-certificates
xorg
openbox
chromium
lightdm
nodejs
npm
PACKAGES

# Copy application files to chroot
echo "Copying Jarvis app files..."
cp -r /app/* config/includes.chroot/opt/jarvis-os/ || true

# We need a build script to run inside the chroot during build to compile the node app
mkdir -p config/hooks/normal
cat << 'HOOK' > config/hooks/normal/0100-build-jarvis.hook.chroot
#!/bin/bash
echo "Building Jarvis App inside chroot..."

# Install nodejs 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Build the app
cd /opt/jarvis-os
pnpm install
pnpm run build

# Setup user and permissions
useradd -m -s /bin/bash -G sudo,video jarvis
echo "jarvis:jarvis" | chpasswd
chown -R jarvis:jarvis /opt/jarvis-os

# Configure autologin for lightdm
mkdir -p /etc/lightdm/lightdm.conf.d/
cat << 'CONF' > /etc/lightdm/lightdm.conf.d/50-autologin.conf
[Seat:*]
autologin-user=jarvis
autologin-user-timeout=0
user-session=openbox
CONF

# Configure Openbox to autostart Jarvis
mkdir -p /home/jarvis/.config/openbox
cat << 'AUTOSTART' > /home/jarvis/.config/openbox/autostart
# Start network applet if needed
# nm-applet &

# Start Jarvis Kiosk Mode
chromium --kiosk --no-sandbox http://localhost:3000 &
AUTOSTART
chown -R jarvis:jarvis /home/jarvis/.config

HOOK
chmod +x config/hooks/normal/0100-build-jarvis.hook.chroot


# Add systemd service for Jarvis backend
cat << 'SERVICE' > config/includes.chroot/etc/systemd/system/jarvis.service
[Unit]
Description=Jarvis AI OS Backend
After=network.target

[Service]
Type=simple
User=jarvis
WorkingDirectory=/opt/jarvis-os
ExecStart=/usr/bin/node dist/index.js
Environment="NODE_ENV=production"
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

# Hook to enable systemd service
cat << 'HOOK' > config/hooks/normal/0200-enable-services.hook.chroot
#!/bin/bash
systemctl enable jarvis.service
HOOK
chmod +x config/hooks/normal/0200-enable-services.hook.chroot


# Build the ISO
echo "Starting lb build..."
lb build

# Check if build was successful
if [ -f live-image-amd64.hybrid.iso ]; then
    echo "Build complete! ISO is available as live-image-amd64.hybrid.iso"
    mv live-image-amd64.hybrid.iso /output/jarvis-os.iso
else
    echo "Build failed! ISO not found."
fi
