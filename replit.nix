{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.chromium
    pkgs.glib
    pkgs.nss
    pkgs.fontconfig
  ];
  env = {
    PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
  };
}
