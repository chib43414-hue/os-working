FROM debian:bookworm

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies for live-build and building the app
RUN apt-get update && apt-get install -y \
    live-build \
    debootstrap \
    curl \
    git \
    sudo \
    squashfs-tools \
    xorriso \
    grub-pc-bin \
    grub-efi-amd64-bin \
    mtools

WORKDIR /build
COPY . /app

# The script that configures live-build and runs it
COPY os-builder/build.sh /build/build.sh
RUN chmod +x /build/build.sh

CMD ["/build/build.sh"]
