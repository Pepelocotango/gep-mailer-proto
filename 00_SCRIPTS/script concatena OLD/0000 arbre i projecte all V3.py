#!/usr/bin/env python3
"""
Genera dos fitxers a 0_CONTEXT_i_eines:
- 00arbre_directoris.txt: arbre complet del projecte (exclou només 0_CONTEXT_i_eines de l'arrel)
- 00_projecte_concatenat.txt: concatenació de fitxers i carpetes rellevants del projecte
Es pot executar des de 0_CONTEXT_i_eines i escaneja l'arrel del projecte automàticament.
"""
import os
import sys
import subprocess

OUTPUT_FILE = "00_projecte_concatenat.txt"
ARBRE_FILE = "00arbre_directoris.txt"

# Configuració per defecte - només necessària si Git no està disponible
GITHUB_DEFAULT_BRANCH = "?"  # Branca per defecte si no es pot detectar

ROOT_FILES_TO_INCLUDE = [
    "package.json", "package-lock.json", "vite.config.ts", "tailwind.config.cjs",
    "postcss.config.cjs", "tsconfig.json", "main.cjs", "preload.cjs", "index.html",
    "README.md", "DEVELOPING.md", "LICENSE", ".gitattributes", ".gitignore", "metadata.json"
]
DIRECTORIES_TO_INCLUDE = ["src", ".github", "examples json"]
DIRECTORIES_TO_EXCLUDE = ["0_CONTEXT_i_eines", "node_modules", "dist", ".git", "chekpoints"]
FILES_TO_EXCLUDE = [
    "google-credentials.json", ".env.local", OUTPUT_FILE, ARBRE_FILE,
    os.path.basename(__file__),
]

# NOU: Llista d'extensions a excloure de la concatenació (insensible a majúscules/minúscules)
EXTENSIONS_TO_EXCLUDE = [
    # Imatges
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp',
    # Vídeos
    '.mp4', '.mov', '.avi', '.mkv', '.webm',
    # Fonts
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    # Documents i binaris
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.7z', '.gz', '.tar',
    '.exe', '.dll', '.so', '.dylib', '.pyc',
]


def get_git_info():
    """Obté informació del repositori Git actual."""
    try:
        # Obté la branca actual
        current_branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        
        return current_branch
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Si no es pot obtenir informació de Git, usa la branca per defecte
        return GITHUB_DEFAULT_BRANCH

def classificar_directoris(dirs):
    """Classifica els directoris en principals i secundaris."""
    # Directoris principals (codi del projecte)
    principals = []
    # Directoris secundaris (configuració, dependencies, etc.)
    secundaris = []
    
    # Patrons per identificar directoris secundaris
    patrons_secundaris = [
        'node_modules', '.git', '.github', '.vscode', '.idea',
        'dist', 'build', 'out', 'target', 'bin', 'obj',
        'examples', 'exemple', 'exemples', 'docs', 'documentation',
        'images', 'img', 'assets', 'static', 'public',
        'test', 'tests', '__pycache__', '.pytest_cache',
        'coverage', '.coverage', 'logs', 'tmp', 'temp',
        'vendor', 'third_party', 'external', 'lib', 'libs',
        'chekpoints', 'checkpoints', 'backup', 'backups',
        '0_CONTEXT_i_eines'
    ]
    
    for d in dirs:
        # Comprova si comença amb punt (fitxers ocults)
        if d.startswith('.') and d not in ['.github']:
            secundaris.append(d)
        # Comprova si conté patrons secundaris
        elif any(patron.lower() in d.lower() for patron in patrons_secundaris):
            secundaris.append(d)
        else:
            principals.append(d)
    
    # Ordena cada categoria
    principals.sort()
    secundaris.sort()
    
    return principals, secundaris

def arbre_simple_a_fitxer(directori_a_escanejar, fitxer_sortida_obj):
    print(f"Arbre del directori: {os.path.abspath(directori_a_escanejar)}\n", file=fitxer_sortida_obj)
    directori_base_norm = os.path.normpath(directori_a_escanejar)
    directorios_a_excluir = []
    if os.path.abspath(directori_a_escanejar) == os.path.abspath(os.path.join(os.path.dirname(__file__), '..')):
        directorios_a_excluir = ['0_CONTEXT_i_eines', 'imatges i recursos']
    directorios_especials = ['node_modules', '.git']
    
    for arrel, dirs, fitxers in os.walk(directori_a_escanejar, topdown=True):
        if directorios_a_excluir and os.path.abspath(arrel) == os.path.abspath(directori_a_escanejar):
            dirs[:] = [d for d in dirs if d not in directorios_a_excluir]
        
        # Classifica i ordena els directoris
        principals, secundaris = classificar_directoris(dirs)
        dirs[:] = principals + secundaris  # Reordena la llista in-place
        
        arrel_norm = os.path.normpath(arrel)
        nivell = 0 if arrel_norm == directori_base_norm else arrel_norm[len(directori_base_norm):].count(os.sep)
        indent = '    ' * nivell
        nom_directori_actual = os.path.basename(arrel_norm)
        
        # Si és node_modules o .git, només mostra el primer nivell de subdirectoris
        if nom_directori_actual in directorios_especials:
            print(f"{indent}{nom_directori_actual}/", file=fitxer_sortida_obj)
            subindent = '    ' * (nivell + 1)
            try:
                subdirs = [d for d in os.listdir(arrel) if os.path.isdir(os.path.join(arrel, d))]
                for d in sorted(subdirs):
                    print(f"{subindent}{d}/", file=fitxer_sortida_obj)
            except Exception:
                pass
            dirs.clear()
            continue
        
        if nivell == 0:
            print(f"{nom_directori_actual}/ (directori arrel de l'escaneig)", file=fitxer_sortida_obj)
        else:
            print(f"{indent}{nom_directori_actual}/", file=fitxer_sortida_obj)
        
        subindent = '    ' * (nivell + 1)
        for f in sorted(fitxers):
            print(f"{subindent}{f}", file=fitxer_sortida_obj)
        
        # Afegeix una línia buida entre directoris principals i secundaris al primer nivell
        if nivell == 0 and principals and secundaris:
            # Compta quants directoris principals s'han processat
            dirs_processats = 0
            for d in dirs:
                if d in principals:
                    dirs_processats += 1
                elif d in secundaris and dirs_processats == len(principals):
                    print("", file=fitxer_sortida_obj)  # Línia buida abans dels secundaris
                    break
        
        if fitxers and dirs:
            print("", file=fitxer_sortida_obj)

def write_file_content(outfile, file_path, project_name, branch, directori_arrel):
    """Escriu el contingut del fitxer amb capçaleres que inclouen el nom del projecte i la branca."""
    # Calcula la ruta relativa des del directori arrel del projecte
    relative_path = os.path.relpath(file_path, directori_arrel).replace(os.sep, '/')
    
    # Genera la capçalera amb el format: ..NomProjecte/ruta/fitxer.ext -- branca nomBranca
    header = f"../{project_name}/{relative_path} -- branca {branch}"
    
    outfile.write(f"--- START OF FILE: {header} ---\n")
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if not content.strip():
                outfile.write("[Fitxer buit]\n")
            else:
                outfile.write(content)
    except Exception as e:
        outfile.write(f"[Error llegint el fitxer: {e}]\n")
    outfile.write(f"\n--- END OF FILE: {header} ---\n\n")

def concatena_projecte(directori_arrel, fitxer_sortida):
    print("Iniciant la concatenació completa del projecte...")
    
    # Obté la branca actual de Git
    branch = get_git_info()
    
    # Obté el nom del directori principal del projecte
    project_name = os.path.basename(directori_arrel)
    
    print(f"Projecte: {project_name}")
    print(f"Branca: {branch}")
    
    files_to_exclude_set = set(FILES_TO_EXCLUDE)
    # MODIFICAT: Crea un set amb les extensions a excloure en minúscules per a una cerca eficient
    extensions_to_exclude_set = set(ext.lower() for ext in EXTENSIONS_TO_EXCLUDE)

    with open(fitxer_sortida, "w", encoding="utf-8") as outfile:
        # Escriu informació del projecte a l'inici del fitxer
        outfile.write(f"=== PROJECTE CONCATENAT ===\n")
        outfile.write(f"Projecte: {project_name}\n")
        outfile.write(f"Branca: {branch}\n")
        outfile.write(f"Generat el: {os.popen('date').read().strip()}\n")
        outfile.write("=" * 50 + "\n\n")
        
        print("Processant fitxers de configuració de l'arrel...")
        for file_name in ROOT_FILES_TO_INCLUDE:
            file_path = os.path.join(directori_arrel, file_name)
            
            # MODIFICAT: Afegeix comprovació d'extensió
            file_ext = os.path.splitext(file_name)[1].lower()
            if file_name in files_to_exclude_set:
                continue
            if file_ext in extensions_to_exclude_set:
                print(f"  -> Ometent (extensió): {file_name}")
                continue

            if os.path.exists(file_path) and os.path.isfile(file_path):
                print(f"  -> Afegint: {file_name}")
                write_file_content(outfile, file_path, project_name, branch, directori_arrel)
            else:
                print(f"Avís: El fitxer d'arrel '{file_name}' no s'ha trobat.")
        
        for directory in DIRECTORIES_TO_INCLUDE:
            dir_path = os.path.join(directori_arrel, directory)
            if not os.path.isdir(dir_path):
                print(f"Avís: El directori '{directory}' no existeix.")
                continue
            print(f"Processant el directori: '{directory}'...")
            for root, dirs, files in os.walk(dir_path, topdown=True):
                dirs[:] = [d for d in dirs if d not in DIRECTORIES_TO_EXCLUDE]
                files.sort()
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    # MODIFICAT: Comprovació d'exclusió per nom de fitxer O per extensió
                    file_ext = os.path.splitext(file)[1].lower()
                    if file in files_to_exclude_set:
                        continue
                    if file_ext in extensions_to_exclude_set:
                        print(f"  -> Ometent (extensió): {file_path}")
                        continue
                    
                    print(f"  -> Afegint: {file_path}")
                    write_file_content(outfile, file_path, project_name, branch, directori_arrel)
    
    print("-" * 50)
    print(f"✅ Procés finalitzat amb èxit.")
    print(f"El projecte complet s'ha escrit a '{fitxer_sortida}'")
    print("-" * 50)

if __name__ == "__main__":
    try:
        directori_script = os.path.dirname(os.path.abspath(__file__))
        directori_arrel = os.path.abspath(os.path.join(directori_script, '..'))
        ruta_arbre = os.path.join(directori_script, ARBRE_FILE)
        ruta_concat = os.path.join(directori_script, OUTPUT_FILE)
        
        with open(ruta_arbre, 'w', encoding='utf-8') as f_out:
            arbre_simple_a_fitxer(directori_arrel, f_out)
        print(f"L'arbre de directoris s'ha generat correctament a: {ruta_arbre}")
        print(f"S'ha escanejat el directori: {directori_arrel}")
        
        concatena_projecte(directori_arrel, ruta_concat)
        print(f"La concatenació del projecte s'ha generat correctament a: {ruta_concat}")
        
        input("\nProcés completat. Prem ENTER per sortir...")
    except Exception as e:
        missatge_error = f"Ha ocorregut un error inesperat: {e}"
        print(missatge_error, file=sys.stderr)
        os.system(f'zenity --error --text="{missatge_error}" --title="Error en Arbre Directoris" 2>/dev/null || true')
        input(f"\nS'ha produït un error inesperat. Prem ENTER per sortir...")
        sys.exit(1)