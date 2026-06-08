#!/usr/bin/env bash
# =============================================================================
#  KraftKurve — Proxmox LXC Installer
#
#  Erstellt einen Debian 12 LXC-Container, installiert Docker und deployt
#  KraftKurve vollautomatisch via docker compose.
#
#  Einzeiler für die Proxmox-Shell:
#    bash -c "$(curl -fsSL https://raw.githubusercontent.com/comcy/KraftKurve/main/proxmox-install.sh)"
#
#  Voraussetzungen: Proxmox VE Host, Root-Zugriff, Internetverbindung
# =============================================================================

set -Eeuo pipefail
trap 'msg_error "Fehler in Zeile ${LINENO}. Exit-Code: $?"' ERR

# ─── Konstanten ──────────────────────────────────────────────────────────────
readonly KRAFTKURVE_REPO="https://github.com/comcy/KraftKurve.git"
readonly APP_DIR="/opt/kraftkurve"
readonly DEBIAN_TEMPLATE_SECTION="system"

# ─── Farben ──────────────────────────────────────────────────────────────────
BL="\e[36m"; GN="\e[92m"; YW="\e[33m"; RD="\e[31m"
CL="\e[0m";  BOLD="\e[1m"; DIM="\e[2m"

msg_info()  { echo -e "  ${BL}◆${CL} ${1}"; }
msg_ok()    { echo -e "  ${GN}✔${CL} ${1}"; }
msg_warn()  { echo -e "  ${YW}⚠${CL}  ${1}"; }
msg_error() { echo -e "\n  ${RD}✘${CL}  ${BOLD}${1}${CL}\n"; exit 1; }
msg_step()  { echo -e "\n${BOLD}${BL}━━  ${1}${CL}\n"; }
msg_line()  { echo -e "  ${DIM}────────────────────────────────────────${CL}"; }

header() {
  clear
  echo -e "${BOLD}${BL}"
  echo "  ██╗  ██╗██████╗  █████╗ ███████╗████████╗"
  echo "  ██║ ██╔╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝"
  echo "  █████╔╝ ██████╔╝███████║█████╗     ██║   "
  echo "  ██╔═██╗ ██╔══██╗██╔══██║██╔══╝     ██║   "
  echo "  ██║  ██╗██║  ██║██║  ██║██║        ██║   "
  echo "  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   "
  echo "  ██╗  ██╗██╗   ██╗██████╗ ██╗   ██╗███████╗"
  echo "  ██║ ██╔╝██║   ██║██╔══██╗██║   ██║██╔════╝"
  echo "  █████╔╝ ██║   ██║██████╔╝██║   ██║█████╗  "
  echo "  ██╔═██╗ ██║   ██║██╔══██╗╚██╗ ██╔╝██╔══╝  "
  echo "  ██║  ██╗╚██████╔╝██║  ██║ ╚████╔╝ ███████╗"
  echo "  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝  ╚═══╝  ╚══════╝"
  echo -e "${CL}"
  echo -e "  ${DIM}Self-hosted Gym Tracker · Proxmox LXC Installer${CL}"
  echo -e "  ${DIM}Repo: ${KRAFTKURVE_REPO}${CL}"
  echo ""
}

# ─── Checks ──────────────────────────────────────────────────────────────────
check_proxmox() {
  command -v pveversion &>/dev/null || [[ -d /etc/pve ]] \
    || msg_error "Dieses Script muss auf einem Proxmox VE Host ausgeführt werden."
  [[ $EUID -eq 0 ]] \
    || msg_error "Bitte als root ausführen."
  for cmd in pct pvesm pveam curl; do
    command -v "$cmd" &>/dev/null \
      || msg_error "Befehl nicht gefunden: '$cmd' — ist das ein Proxmox VE Host?"
  done
}

# ─── Nächste freie CT-ID ─────────────────────────────────────────────────────
next_ct_id() {
  local id=100
  while pct status "$id" &>/dev/null; do ((id++)); done
  echo "$id"
}

# ─── rootdir-fähige Storages ─────────────────────────────────────────────────
list_storages() {
  # Parse /etc/pve/storage.cfg directly — most reliable; pvesm flags vary by version.
  # Format: each stanza starts with "type: name" on a line beginning at col 0;
  # options are indented. We print the stanza name whenever its content line includes rootdir.
  local cfg="/etc/pve/storage.cfg"
  if [[ -f "$cfg" ]]; then
    awk '
      /^[a-zA-Z]/ { if (name && has_rootdir) print name; name = $2; has_rootdir = 0 }
      /^[[:space:]]+content / && /rootdir/ { has_rootdir = 1 }
      END { if (name && has_rootdir) print name }
    ' "$cfg"
    return
  fi
  # Fallback: pvesm status (column layout: Name Type Status ...)
  pvesm status 2>/dev/null | awk 'NR>1 && $3=="active" {print $1}' || true
}

# ─── vztmpl-fähigen Storage finden ───────────────────────────────────────────
find_tmpl_storage() {
  # Only directory-type storages support vztmpl (local-lvm/ZFS pools do not)
  local cfg="/etc/pve/storage.cfg" result
  if [[ -f "$cfg" ]]; then
    result=$(awk '
      /^[a-zA-Z]/ { if (name && has_vztmpl) print name; name = $2; has_vztmpl = 0 }
      /^[[:space:]]+content / && /vztmpl/ { has_vztmpl = 1 }
      END { if (name && has_vztmpl) print name }
    ' "$cfg" | head -n1)
    [[ -n "$result" ]] && echo "$result" && return
  fi
  echo "local"
}

# ─── Debian 12 Template sicherstellen ────────────────────────────────────────
ensure_template() {
  # NOTE: all msg_* calls use >&2 so they appear on the terminal even when
  # this function is called inside $() where stdout is captured.
  local storage="${1}" tmpl available

  msg_info "Suche Debian 12 Template" >&2
  tmpl=$(pveam list "$storage" 2>/dev/null \
    | awk '/debian-12-standard/ {print $1}' | tail -n1 || true)

  if [[ -z "$tmpl" ]]; then
    msg_info "Template nicht lokal — lade Paketliste" >&2
    pveam update &>/dev/null
    available=$(pveam available --section "$DEBIAN_TEMPLATE_SECTION" 2>/dev/null \
      | awk '/debian-12-standard/ {print $2}' | tail -n1 || true)
    [[ -z "$available" ]] \
      && msg_error "Kein Debian 12 Template in der Proxmox-Datenbank gefunden."
    msg_info "Lade herunter: $available" >&2
    pveam download "$storage" "$available" \
      || msg_error "Template-Download fehlgeschlagen (Storage '${storage}' unterstützt möglicherweise kein vztmpl)."
    tmpl="${storage}:vztmpl/${available}"
  fi

  msg_ok "Template: $(basename "$tmpl")" >&2
  echo "$tmpl"
}

# ─── Eingabe-Helfer ──────────────────────────────────────────────────────────
ask() {
  # ask "Prompt" "default" → gibt Eingabe oder Default zurück
  local prompt="${1}" default="${2:-}" answer
  read -rp "  ${prompt} [${default}]: " answer
  echo "${answer:-$default}"
}

ask_secret() {
  # ask_secret "Prompt" → gibt Passwort zurück (kein Echo, Bestätigung)
  # IMPORTANT: all terminal output goes to stderr so callers can use $() without
  # capturing newlines from echo "" into the password value.
  local prompt="${1}" pass confirm
  while true; do
    read -rsp "  ${prompt}: "        pass;    printf '\n' >&2
    [[ -z "$pass" ]] && printf "  ${YW}Darf nicht leer sein.${CL}\n" >&2 && continue
    read -rsp "  Bestätigen:  " confirm; printf '\n' >&2
    [[ "$pass" == "$confirm" ]] && break
    printf "  ${YW}Stimmt nicht überein — erneut.${CL}\n" >&2
  done
  printf '%s' "$pass"
}

# ─── Befehl im Container ausführen ───────────────────────────────────────────
run_ct() { pct exec "${CT_ID}" -- bash -c "${1}"; }

# =============================================================================
#  MAIN
# =============================================================================
header
check_proxmox

# ─── 1 · Container-Konfiguration ─────────────────────────────────────────────
msg_step "1 / 5  Container-Konfiguration"

DEFAULT_ID="$(next_ct_id)"
CT_ID="$(ask     "Container-ID"   "$DEFAULT_ID")"
pct status "$CT_ID" &>/dev/null \
  && msg_error "CT-ID ${CT_ID} ist bereits vergeben."

CT_HOSTNAME="$(ask "Hostname"     "kraftkurve")"

echo -e "\n  ${BOLD}Container Root-Passwort${CL}"
CT_PASSWORD="$(ask_secret "Root-Passwort")"

# Storage
mapfile -t STORAGES < <(list_storages)
[[ ${#STORAGES[@]} -eq 0 ]] \
  && msg_error "Kein rootdir-fähiger Storage gefunden."

if [[ ${#STORAGES[@]} -eq 1 ]]; then
  CT_STORAGE="${STORAGES[0]}"
  msg_ok "Storage: ${CT_STORAGE}"
else
  echo -e "\n  ${BOLD}Verfügbare Storages:${CL}"
  for i in "${!STORAGES[@]}"; do echo "    $((i+1)))  ${STORAGES[$i]}"; done
  IDX="$(ask "Storage-Nummer" "1")"
  CT_STORAGE="${STORAGES[$((IDX-1))]}"
fi

CT_DISK="$(ask  "Disk-Größe (GB)" "8")"
CT_RAM="$(ask   "RAM (MB)"        "1024")"
CT_CORES="$(ask "CPU-Kerne"       "2")"
CT_BRIDGE="$(ask "Netzwerk-Bridge" "vmbr0")"

echo ""
echo -e "  ${DIM}IP: 'dhcp' oder z.B. 192.168.1.50/24${CL}"
CT_IP="$(ask "IP-Adresse" "dhcp")"
CT_GW=""
if [[ "$CT_IP" != "dhcp" ]]; then
  CT_GW="$(ask "Gateway" "")"
fi

# ─── 2 · KraftKurve-Konfiguration ────────────────────────────────────────────
msg_step "2 / 5  KraftKurve-Konfiguration"

APP_PORT="$(ask "App-Port" "8080")"

echo ""
echo -e "  ${BOLD}Admin-Zugangsdaten${CL}"
ADMIN_EMAIL="$(ask    "Admin-Email"    "admin@kraftkurve.local")"
ADMIN_PASSWORD="$(ask_secret "Admin-Passwort")"

# JWT Secret automatisch generieren
if python3 -c '' &>/dev/null; then
  JWT_SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
else
  JWT_SECRET="$(dd if=/dev/urandom bs=1 count=32 2>/dev/null | od -A n -t x1 | tr -d ' \n')"
fi
[[ -n "$JWT_SECRET" ]] || msg_error "JWT-Secret konnte nicht generiert werden."

# Zusammenfassung vor dem Start
echo ""
msg_line
echo -e "  ${BOLD}Zusammenfassung${CL}"
echo ""
printf "  %-18s %s\n"  "CT-ID:"      "$CT_ID"
printf "  %-18s %s\n"  "Hostname:"   "$CT_HOSTNAME"
printf "  %-18s %s\n"  "Storage:"    "$CT_STORAGE  (${CT_DISK}GB)"
printf "  %-18s %s\n"  "Ressourcen:" "${CT_RAM}MB RAM  ${CT_CORES} Cores"
printf "  %-18s %s\n"  "Netzwerk:"   "IP=${CT_IP}  Bridge=${CT_BRIDGE}"
printf "  %-18s %s\n"  "App-Port:"   "$APP_PORT"
printf "  %-18s %s\n"  "Admin:"      "$ADMIN_EMAIL"
printf "  %-18s %s\n"  "Repo:"       "$KRAFTKURVE_REPO"
echo ""
msg_line
echo ""
read -rp "  Jetzt starten? [j/N]: " CONFIRM
[[ "${CONFIRM,,}" != "j" ]] && echo -e "\n  Abgebrochen." && exit 0

# ─── 3 · Template & LXC erstellen ────────────────────────────────────────────
msg_step "3 / 5  Template & Container"

TMPL_STORAGE="$(find_tmpl_storage)"
msg_info "Template-Storage: ${TMPL_STORAGE}"
TEMPLATE="$(ensure_template "$TMPL_STORAGE")"

NET_STR="name=eth0,bridge=${CT_BRIDGE}"
if [[ "$CT_IP" == "dhcp" ]]; then
  NET_STR+=",ip=dhcp,ip6=dhcp"
else
  NET_STR+=",ip=${CT_IP}"
  [[ -n "$CT_GW" ]] && NET_STR+=",gw=${CT_GW}"
fi

msg_info "Erstelle LXC ${CT_ID} (unprivileged + nesting + keyctl)"
pct create "${CT_ID}" "${TEMPLATE}" \
  --hostname    "${CT_HOSTNAME}"          \
  --password    "${CT_PASSWORD}"          \
  --unprivileged 1                        \
  --features    "nesting=1,keyctl=1"      \
  --storage     "${CT_STORAGE}"           \
  --rootfs      "${CT_STORAGE}:${CT_DISK}"\
  --memory      "${CT_RAM}"               \
  --cores       "${CT_CORES}"             \
  --net0        "${NET_STR}"              \
  --ostype      debian                    \
  --onboot      1                         \
  --start       0                         \
  &>/dev/null
msg_ok "Container ${CT_ID} erstellt"

msg_info "Starte Container"
pct start "${CT_ID}"
sleep 8
msg_ok "Container läuft"

# ─── 4 · Docker & KraftKurve installieren ────────────────────────────────────
msg_step "4 / 5  Docker & KraftKurve"

msg_info "System-Update"
run_ct "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq" \
  &>/dev/null
msg_ok "System aktualisiert"

msg_info "Basis-Pakete (curl, git, gnupg)"
run_ct "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  ca-certificates curl gnupg git" &>/dev/null
msg_ok "Basis-Pakete installiert"

msg_info "Docker CE (Repository einrichten)"
run_ct "install -m 0755 -d /etc/apt/keyrings" &>/dev/null
run_ct "curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && chmod a+r /etc/apt/keyrings/docker.gpg" \
  &>/dev/null
run_ct 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list' &>/dev/null
run_ct "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  docker-ce docker-ce-cli containerd.io docker-compose-plugin" &>/dev/null
run_ct "systemctl enable --now docker" &>/dev/null
msg_ok "Docker CE installiert"

msg_info "Repository klonen (${KRAFTKURVE_REPO})"
run_ct "git clone '${KRAFTKURVE_REPO}' '${APP_DIR}'" &>/dev/null
msg_ok "Repository geklont"

# .env sicher per pct push übertragen (kein Shell-Quoting-Problem bei Sonderzeichen)
msg_info "Konfiguration schreiben"
TMP_ENV="$(mktemp)"
cat > "${TMP_ENV}" <<EOF
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
PORT="${APP_PORT}"
DATA_DIR="${APP_DIR}/data"
JWT_SECRET="${JWT_SECRET}"
EOF
pct push "${CT_ID}" "${TMP_ENV}" "${APP_DIR}/.env"
rm -f "${TMP_ENV}"
msg_ok ".env erstellt"

msg_info "docker compose up --build  (5–10 Minuten, Node-Build läuft)"
run_ct "cd '${APP_DIR}' && docker compose up -d --build" \
  || msg_error "docker compose fehlgeschlagen — prüfe mit: pct enter ${CT_ID}"
msg_ok "KraftKurve gestartet"

# ─── 5 · Ergebnis ────────────────────────────────────────────────────────────
msg_step "5 / 5  Fertig"

CT_IP_ACTUAL="$(pct exec "${CT_ID}" -- bash -c \
  "hostname -I 2>/dev/null | awk '{print \$1}'" || echo "unbekannt")"

echo -e "  ${GN}${BOLD}KraftKurve läuft in Container ${CT_ID}.${CL}"
echo ""
printf "  %-20s ${BOLD}%s${CL}\n" "Container-IP:"   "$CT_IP_ACTUAL"
printf "  %-20s ${BOLD}${BL}%s${CL}\n" "App erreichbar:" "http://${CT_IP_ACTUAL}:${APP_PORT}"
printf "  %-20s ${BOLD}%s${CL}\n" "Admin-Login:"    "$ADMIN_EMAIL"
echo ""
echo -e "  ${YW}HTTPS${CL} (für PWA-Install + Offline-Mode empfohlen):"
echo -e "  ${DIM}→ Nginx Proxy Manager: Proxy Host auf ${CT_IP_ACTUAL}:${APP_PORT} → Let's Encrypt${CL}"
echo ""
msg_line
printf "  %-20s %s\n" "Shell:" "pct enter ${CT_ID}"
printf "  %-20s %s\n" "Logs:"  "pct exec ${CT_ID} -- docker compose -f ${APP_DIR}/docker-compose.yml logs -f"
printf "  %-20s %s\n" "Update:" "pct exec ${CT_ID} -- bash -c 'cd ${APP_DIR} && git pull && docker compose up -d --build'"
printf "  %-20s %s\n" "Daten-Backup:" "$(pvesh get /nodes/$(hostname)/lxc/${CT_ID}/config 2>/dev/null | grep rootfs | awk '{print $2}' | cut -d, -f1 || echo "/var/lib/lxc/${CT_ID}/rootfs")${APP_DIR}/data/"
msg_line
echo ""
