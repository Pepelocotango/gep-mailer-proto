#!/usr/bin/env python3
"""
Concatenador de projecte per a IA.
Escaneja directoris específics (arrel, src/) i genera un fitxer 
amb tot el codi rellevant, informant de les exclusions a l'arrel.
"""
import os
import subprocess
from datetime import datetime
from pathlib import Path

# === CONFIGURACIÓ ===

FILES_EXCLUDE = [
    "service-account.json", 
    "google-credentials.json", 
    "LICENSE",
    "package-lock.json"
]

EXT_EXCLUDE = [
    #//'.md', '.txt',#->incloure txt i md
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.mp4', '.mov', '.avi', '.mkv',
    '.woff', '.woff2', '.ttf', '.eot',
    '.pdf', '.zip', '.rar', '.exe', '.pyc'
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

def should_include(file_path: Path, project_root: Path) -> bool:
    """Determina si un fitxer s'ha d'incloure."""
    # La comprovació de fitxers ocults es farà directament al bucle principal
    # per poder reportar-los correctament a les llistes d'exclusió.
    if any(part.startswith('.') for part in file_path.relative_to(project_root).parts):
        return False
        
    if file_path.name in FILES_EXCLUDE:
        return False
        
    if file_path.suffix.lower() in EXT_EXCLUDE:
        return False
        
    return True

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
        return
    
    project_name = project_root.name
    branch = get_git_branch(project_root)
    branch_safe = branch.replace('/', '_')
    
    output_file = script_dir / f"CODI_concatenat_{branch_safe}.txt"
    
    excluded_root_files = []
    excluded_root_dirs = []

    print(f"📦 Projecte: {project_name}")
    print(f"🌿 Branca: {branch}")
    print(f"📝 Generant fitxer: {output_file.name}")
    print("-" * 50)
    
    with output_file.open("w", encoding="utf-8") as f:
        f.write(f"=== PROJECTE CONCATENAT ===\n")
        f.write(f"Projecte: {project_name}\n")
        f.write(f"Branca: {branch}\n")
        f.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 50 + "\n\n")
        
        # --- LÒGICA CORREGIDA PER PROCESSAR L'ARREL ---
        print("\n📋 Processant arrel del projecte:")
        for path_item in sorted(project_root.iterdir()):
            # Cas 1: És un directori
            if path_item.is_dir():
                # No afegir 'src' ni la carpeta de l'script a la llista d'exclosos, simplement saltar-los
                if path_item.name == 'src' or path_item.resolve() == script_dir:
                    continue
                # Qualsevol altre directori a l'arrel s'exclou
                excluded_root_dirs.append(path_item.name)
            
            # Cas 2: És un fitxer
            elif path_item.is_file():
                if should_include(path_item, project_root):
                    print(f"  ✓ {path_item.name}")
                    write_file_content(f, path_item, project_name, branch, project_root)
                else:
                    excluded_root_files.append(path_item.name)

        # 2. Processar el directori 'src/' de forma recursiva
        src_path = project_root / "src"
        if src_path.is_dir():
            print(f"\n📁 Processant directori 'src/':")
            for path_item in sorted(src_path.rglob("*")):
                if path_item.is_file() and should_include(path_item, project_root):
                    rel_path = path_item.relative_to(project_root)
                    print(f"  ✓ {rel_path}")
                    write_file_content(f, path_item, project_name, branch, project_root)
        
        # Generar resum d'exclusions
        summary = "\n" + "=" * 50 + "\n"
        summary += "=== RESUM D'EXCLUSIONS A L'ARREL ===\n\n"
        summary += "Fitxers exclosos de l'arrel:\n"
        if excluded_root_files:
            for item in sorted(excluded_root_files): summary += f"- {item}\n"
        else:
            summary += "- Cap\n"
        
        summary += "\nDirectoris exclosos de l'arrel:\n"
        if excluded_root_dirs:
            for item in sorted(excluded_root_dirs): summary += f"- {item}/\n"
        else:
            summary += "- Cap\n"
            
        f.write(summary)

    print("\n" + "=" * 50)
    print(f"✅ Procés finalitzat. Generat: {output_file.name}")
    
    print("\n🔍 Resum d'exclusions a l'arrel del projecte:")
    print("  📄 Fitxers exclosos:")
    if excluded_root_files:
        for item in sorted(excluded_root_files): print(f"    - {item}")
    else:
        print("    - Cap")
        
    print("  📁 Directoris exclosos:")
    if excluded_root_dirs:
        for item in sorted(excluded_root_dirs): print(f"    - {item}/")
    else:
        print("    - Cap")

if __name__ == "__main__":
    main()