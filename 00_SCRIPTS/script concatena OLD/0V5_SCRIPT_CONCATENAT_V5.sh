#!/usr/bin/env python3
"""
Eina de lÃ­nia de comandes per generar un context complet d'un projecte de codi.

Genera dos fitxers dins de la carpeta on s'executa:
- Un arbre de directoris del projecte.
- Una concatenaciÃ³ de tots els fitxers de codi rellevants.

IMPORTANT: Aquesta eina escaneja SEMPRE el directori pare (..) d'on es troba l'script.
Els noms de fitxer per defecte inclouran automÃ ticament el nom de la branca de Git.
"""
import os
import sys
import subprocess
import argparse
from datetime import datetime
from pathlib import Path

# --- CONFIGURACIÃ" PER DEFECTE ---
DEFAULT_OUTPUT_FILE = "0_CODI_concatenat.txt"
DEFAULT_TREE_FILE = "0_Arbre_concatenat.txt"

# Llistes de fitxers i directoris a incloure/excloure
ROOT_FILES_TO_INCLUDE = [
    "package.json", 
    # "package-lock.json",  # Comentat per desactivar la concatenació
    "vite.config.ts", "tailwind.config.cjs",
    "postcss.config.cjs", "tsconfig.json", "main.cjs", "preload.cjs", "index.html",
    "README.md", "DEVELOPING.md", "LICENSE", ".gitattributes", ".gitignore", "metadata.json",
    "ARBRE_DIRECTORIS_V1_DETALLAT-refactor.txt", "ARBRE_DIRECTORIS_V1_DETALLAT.txt",
]
DIRECTORIES_TO_INCLUDE = ["src", ".github", "examples json"]
DIRECTORIES_TO_EXCLUDE = ["node_modules", "dist", ".git", "chekpoints", "imatges i recursos"]
FILES_TO_EXCLUDE = ["google-credentials.json", ".env.local"]
EXTENSIONS_TO_EXCLUDE = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp', # Imatges
    '.mp4', '.mov', '.avi', '.mkv', '.webm', # VÃ­deos
    '.woff', '.woff2', '.ttf', '.eot', '.otf', # Fonts
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', # Documents
    '.zip', '.rar', '.7z', '.gz', '.tar', # Comprimits
    '.exe', '.dll', '.so', '.dylib', '.pyc', '.o', # Binaris
]
# --- FI DE LA CONFIGURACIÃ" ---

def get_git_info(repo_path: Path) -> str:
    """ObtÃ© la branca actual del repositori Git. Torna '?' si no Ã©s un repo Git."""
    if not (repo_path / ".git").is_dir():
        return "?"
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8',
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "?"

def generate_directory_tree(project_path: Path, tree_file: Path, project_name: str, branch: str, quiet: bool):
    """Genera i escriu l'arbre de directoris en un fitxer."""
    if not quiet:
        print(f"Generant l'arbre de directoris a '{tree_file}'...")
    
    script_dir_name = Path(__file__).parent.name
    all_excluded_dirs = DIRECTORIES_TO_EXCLUDE + [script_dir_name]

    with tree_file.open("w", encoding="utf-8") as f:
        f.write(f"=== ARBRE DE DIRECTORIES ===\n")
        f.write(f"Projecte: {project_name}\n")
        f.write(f"Branca: {branch}\n")
        f.write(f"Generat el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 50 + "\n\n")

        for root_str, dirs, files in os.walk(project_path):
            root = Path(root_str)
            if root == project_path:
                dirs[:] = sorted([d for d in dirs if d not in all_excluded_dirs])
            else:
                 dirs.sort()
            level = len(root.relative_to(project_path).parts)
            indent = "    " * level
            f.write(f"{indent}{root.name}/\n" if root != project_path else f"./ ({project_name})\n")
            sub_indent = "    " * (level + 1)
            for file in sorted(files):
                f.write(f"{sub_indent}{file}\n")
            if files and dirs: f.write("\n")
    if not quiet: print("âœ… Arbre de directoris generat amb Ã¨xit.")

def write_file_content(outfile, file_path: Path, project_name: str, branch: str, project_root: Path):
    """Escriu el contingut d'un fitxer al fitxer de sortida principal amb una capÃ§alera."""
    relative_path = file_path.relative_to(project_root).as_posix()
    header = f"../{project_name}/{relative_path} -- branca {branch}"
    outfile.write(f"--- START OF FILE: {header} ---\n")
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        outfile.write(content if content.strip() else "[Fitxer buit]\n")
    except Exception as e:
        outfile.write(f"[Error llegint el fitxer: {e}]\n")
    outfile.write(f"\n--- END OF FILE: {header} ---\n\n")

def should_include_file(file_path: Path, files_to_exclude_set: set, extensions_to_exclude_set: set) -> bool:
    """Determina si un fitxer s'ha d'incloure basant-se en les regles."""
    file_name = file_path.name
    file_extension = file_path.suffix.lower()
    
    # Sempre incloure fitxers .md i .txt (prioritat màxima)
    if file_extension in ['.md', '.txt']:
        return True
    
    # Si el fitxer està explícitament exclòs, no l'incloem
    if file_name in files_to_exclude_set:
        return False
    
    # Si l'extensió està exclosa, no l'incloem
    if file_extension in extensions_to_exclude_set:
        return False
    
    return True

def concatenate_project_files(project_path: Path, output_file: Path, tree_file: Path, project_name: str, branch: str, quiet: bool):
    """Recorre el projecte i concatena els fitxers rellevants."""
    if not quiet: print(f"Iniciant la concatenaciÃ³ del projecte a '{output_file}'...")
    
    script_file_name = Path(__file__).name
    files_to_exclude_set = set(FILES_TO_EXCLUDE + [script_file_name, output_file.name, tree_file.name])
    extensions_to_exclude_set = set(ext.lower() for ext in EXTENSIONS_TO_EXCLUDE)
    script_dir_name = Path(__file__).parent.name
    all_excluded_dirs = DIRECTORIES_TO_EXCLUDE + [script_dir_name]

    with output_file.open("w", encoding="utf-8") as outfile:
        outfile.write(f"=== PROJECTE CONCATENAT ===\n")
        outfile.write(f"Projecte: {project_name}\n")
        outfile.write(f"Branca: {branch}\n")
        outfile.write(f"Generat el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        outfile.write("=" * 50 + "\n\n")

        if not quiet: print("Processant fitxers de l'arrel...")
        
        # Primer, afegir els fitxers explícitament llistats
        for file_name in ROOT_FILES_TO_INCLUDE:
            file_path = project_path / file_name
            if file_path.is_file():
                if not quiet: print(f"  -> Afegint: {file_name}")
                write_file_content(outfile, file_path, project_name, branch, project_path)
        
        # Després, buscar i afegir TOTS els fitxers .md i .txt de l'arrel
        processed_files = set(ROOT_FILES_TO_INCLUDE + [script_file_name, output_file.name, tree_file.name])
        for file_path in project_path.iterdir():
            if file_path.is_file() and file_path.name not in processed_files:
                if file_path.suffix.lower() in ['.md', '.txt']:
                    if not quiet: print(f"  -> Afegint (auto .md/.txt): {file_path.name}")
                    write_file_content(outfile, file_path, project_name, branch, project_path)
        
        for directory in DIRECTORIES_TO_INCLUDE:
            dir_path = project_path / directory
            if not dir_path.is_dir(): continue
            if not quiet: print(f"Processant directori: '{directory}'...")
            for root_str, dirs, files in os.walk(dir_path):
                root = Path(root_str)
                dirs[:] = sorted([d for d in dirs if d not in all_excluded_dirs])
                for file in sorted(files):
                    file_path = root / file
                    if should_include_file(file_path, files_to_exclude_set, extensions_to_exclude_set):
                        if not quiet: print(f"  -> Afegint: {file_path.relative_to(project_path)}")
                        write_file_content(outfile, file_path, project_name, branch, project_path)

    if not quiet:
        print("-" * 50)
        print(f"âœ… ProcÃ©s de concatenaciÃ³ finalitzat.")
        print("-" * 50)

def main():
    """FunciÃ³ principal que parseja arguments i orquestra les tasques."""
    parser = argparse.ArgumentParser(
        description="Genera un context del projecte ubicat al directori pare.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("-o", "--output", default=DEFAULT_OUTPUT_FILE, help=f"Nom del fitxer de sortida per al codi concatenat.\n(per defecte: {DEFAULT_OUTPUT_FILE}, s'afegirÃ  la branca)")
    parser.add_argument("-t", "--tree", default=DEFAULT_TREE_FILE, help=f"Nom del fitxer de sortida per a l'arbre de directoris.\n(per defecte: {DEFAULT_TREE_FILE}, s'afegirÃ  la branca)")
    parser.add_argument("-q", "--quiet", action="store_true", help="Mode silenciÃ³s. No mostra missatges de progrÃ©s.")
    args = parser.parse_args()

    script_location = Path(__file__).parent
    project_root = (script_location / "..").resolve()
    
    if not project_root.is_dir():
        print(f"Error: El directori pare '{project_root}' no s'ha trobat o no Ã©s un directori.", file=sys.stderr)
        sys.exit(1)

    project_name = project_root.name
    branch = get_git_info(project_root)
    
    # MODIFICAT: LÃ²gica per afegir la branca al nom del fitxer si s'usa el valor per defecte.
    sanitized_branch = branch.replace('/', '_').replace('\\', '_')

    # Determinar el nom final del fitxer de codi
    if args.output == DEFAULT_OUTPUT_FILE and sanitized_branch != "?":
        p = Path(DEFAULT_OUTPUT_FILE)
        output_filename = f"{p.stem}_{sanitized_branch}{p.suffix}"
    else:
        output_filename = args.output

    # Determinar el nom final del fitxer de l'arbre
    if args.tree == DEFAULT_TREE_FILE and sanitized_branch != "?":
        p = Path(DEFAULT_TREE_FILE)
        tree_filename = f"{p.stem}_{sanitized_branch}{p.suffix}"
    else:
        tree_filename = args.tree

    output_file_path = (script_location / output_filename).resolve()
    tree_file_path = (script_location / tree_filename).resolve()

    try:
        if not args.quiet:
            print(f"Escanejant projecte: '{project_name}' a '{project_root}'")
            print(f"Branca detectada: {branch}")
            print("-" * 50)
        
        generate_directory_tree(project_root, tree_file_path, project_name, branch, args.quiet)
        concatenate_project_files(project_root, output_file_path, tree_file_path, project_name, branch, args.quiet)
        
        if not args.quiet:
            print(f"\nProcÃ©s completat amb Ã¨xit!")
            print(f"Arbre de directoris guardat a: {tree_file_path}")
            print(f"Projecte concatenat guardat a: {output_file_path}")

    except Exception as e:
        print(f"\nHa ocorregut un error inesperat: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()