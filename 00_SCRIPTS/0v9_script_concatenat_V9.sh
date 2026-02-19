#!/usr/bin/env python3
"""
Concatenador de projecte per a IA (versió simplificada).
Escaneja tot el projecte de manera recursiva i exclou els fitxers i 
directoris especificats. Al final, espera que l'usuari premi Enter.
"""
import os
import subprocess
from datetime import datetime
from pathlib import Path

# === CONFIGURACIÓ ===

# 1. DIRECTORIS A EXCLOURE COMPLETAMENT
# Qualsevol directori amb aquest nom serà ignorat juntament amb tot el seu contingut.
DIRS_EXCLUDE = [
    ".git",
    "node_modules",
    "dist",
    "build",
    "captures_pantalla", # Carpeta d'imatges que no és necessària
    # Afegeix aquí altres directoris que vulguis ignorar, com '.vscode', '.idea', etc.
]

# 2. FITXERS A EXCLOURE PEL SEU NOM
FILES_EXCLUDE = [
    "service-account.json", 
    "google-credentials.json", 
    "LICENSE",
    "package-lock.json"
]

# 3. FITXERS A EXCLOURE PER LA SEVA EXTENSIÓ
EXT_EXCLUDE = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.icns',
    '.mp4', '.mov', '.avi', '.mkv',
    '.woff', '.woff2', '.ttf', '.eot',
    '.pdf', '.zip', '.rar', '.exe', '.pyc',
    '.DS_Store'
]

def get_git_branch(path: Path) -> str:
    """Obté la branca Git actual."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=path, capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except:
        return "unknown"

def write_file_content(f, file_path: Path, project_name: str, branch: str, project_root: Path):
    """Escriu el contingut d'un fitxer al fitxer de sortida."""
    rel_path = file_path.relative_to(project_root).as_posix()
    header = f"../{project_name}/{rel_path} -- branca {branch}"
    
    f.write(f"--- START: {header} ---\n")
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        f.write(content if content.strip() else "[Fitxer buit]\n")
    except Exception as e:
        f.write(f"[Error: {e}]\n")
    f.write(f"\n--- END: {header} ---\n\n")

def main():
    """Funció principal."""
    script_dir = Path(__file__).parent.resolve()
    project_root = (script_dir / "..").resolve()
    
    if not project_root.is_dir():
        print("❌ Error: No es troba el directori pare del projecte.")
        input("Prem Enter per a sortir...")
        return
    
    project_name = project_root.name
    branch = get_git_branch(project_root)
    branch_safe = branch.replace('/', '_')
    
    output_file = script_dir / f"CODI_concatenat_{branch_safe}.txt"
    
    # Afegeix dinàmicament la carpeta de l'script a les exclusions
    # per evitar que s'inclogui a si mateix o al seu output.
    if script_dir != project_root:
        DIRS_EXCLUDE.append(script_dir.name)

    print(f"📦 Projecte: {project_name}")
    print(f"🌿 Branca: {branch}")
    print(f"📝 Generant fitxer: {output_file.name}")
    print("-" * 50)
    
    with output_file.open("w", encoding="utf-8") as f_out:
        f_out.write(f"=== PROJECTE CONCATENAT ===\n")
        f_out.write(f"Projecte: {project_name}\n")
        f_out.write(f"Branca: {branch}\n")
        f_out.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f_out.write("=" * 50 + "\n\n")
        
        # os.walk ens permet recórrer l'arbre de directoris.
        # topdown=True és clau, ja que ens permet modificar la llista 'dirs'
        # per evitar que l'script entri en directoris exclosos.
        for root, dirs, files in os.walk(project_root, topdown=True):
            # Modifiquem la llista 'dirs' EN EL LLOC per podar l'arbre de directoris.
            # Això és molt més eficient que recórrer-ho tot.
            dirs[:] = [d for d in dirs if d not in DIRS_EXCLUDE]

            # Ara, processem els fitxers del directori actual
            for filename in sorted(files):
                file_path = Path(root) / filename

                # Apliquem les regles d'exclusió per nom i extensió
                if filename in FILES_EXCLUDE or file_path.suffix.lower() in EXT_EXCLUDE:
                    continue

                # Si passa tots els filtres, l'incloem
                rel_path_str = file_path.relative_to(project_root).as_posix()
                print(f"  ✓ {rel_path_str}")
                write_file_content(f_out, file_path, project_name, branch, project_root)

    print("\n" + "=" * 50)
    print(f"✅ Procés finalitzat. Generat: {output_file.name}")
    print("\nℹ️ S'han exclòs els directoris:", ", ".join(f"'{d}/'" for d in DIRS_EXCLUDE))

    # === LÍNIA AFEGIDA ===
    # Aquesta línia pausarà l'script fins que l'usuari premi la tecla Enter.
    input("\nPrem Enter per a sortir...")

if __name__ == "__main__":
    main()