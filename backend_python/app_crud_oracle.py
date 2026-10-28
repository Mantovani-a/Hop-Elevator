import sys

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    import pandas as pd  # type: ignore
    PANDAS_DISPONIVEL = True
except ImportError:
    PANDAS_DISPONIVEL = False

try:
    import oracledb as cx_Oracle  # type: ignore
    ORACLE_DISPONIVEL = True
except ImportError:
    try:
        import cx_Oracle  # type: ignore
        ORACLE_DISPONIVEL = True
    except ImportError:
        ORACLE_DISPONIVEL = False


class Chamado:
    """Modelo de domínio representando uma ocorrência de elevador."""

    STATUS_VALIDOS = ("ABERTO", "EM_ANDAMENTO", "CONCLUIDO")

    def __init__(self, id_chamado, elevador, local, descricao, passageiros_presos="N", status="ABERTO"):
        self.id = id_chamado
        self.elevador = elevador.strip().upper()
        self.local = local.strip()
        self.descricao = descricao.strip()
        self.passageiros_presos = passageiros_presos.strip().upper()
        self.prioridade = "ALTA" if self.passageiros_presos == "S" else "MEDIA"
        self.status = status.strip().upper()

    def is_urgente(self):
        return self.passageiros_presos == "S"

    def atualizar_status(self, novo_status):
        status_formatado = novo_status.strip().upper()
        if status_formatado not in self.STATUS_VALIDOS:
            raise ValueError(f"Status invalido: {novo_status}. Opcoes: {self.STATUS_VALIDOS}")
        self.status = status_formatado

    def to_dict(self):
        return {
            "id": self.id,
            "elevador": self.elevador,
            "local": self.local,
            "problema": self.descricao,
            "prioridade": self.prioridade,
            "presos": self.passageiros_presos,
            "status": self.status
        }


class ConexaoOracle:
    """Gerenciador de infraestrutura e conexão com Oracle."""

    def __init__(self, user="rmXXXXXX", password="sua_senha", dsn="oracle.fiap.com.br:1521/ORCL"):
        self.user = user
        self.password = password
        self.dsn = dsn

    def conectar(self):
        if not ORACLE_DISPONIVEL:
            return None
        try:
            return cx_Oracle.connect(user=self.user, password=self.password, dsn=self.dsn)
        except Exception as erro:
            print(f"\n[ERRO CIRCUNSTANCIAL] Falha na conexao Oracle: {erro}")
            return None


class ChamadoRepository:
    """Repositório de acesso a dados (Oracle com fallback local em memória)."""

    def __init__(self, conexao_manager):
        self.conexao_manager = conexao_manager
        self.dados_locais = [
            Chamado(1, "ELV-01", "Torre Paulista", "Porta travada no 4 andar", "S", "ABERTO"),
            Chamado(2, "ELV-02", "Hospital Sta Joana", "Ruido no contrapeso", "N", "EM_ANDAMENTO")
        ]

    def listar_todos(self):
        conexao = self.conexao_manager.conectar()
        if conexao:
            try:
                query = "SELECT * FROM chamados_otis ORDER BY id_chamado DESC"
                if PANDAS_DISPONIVEL:
                    df = pd.read_sql(query, conexao)
                    print(df.to_string(index=False))
                else:
                    cursor = conexao.cursor()
                    cursor.execute(query)
                    for linha in cursor.fetchall():
                        print(linha)
                    cursor.close()
                conexao.close()
                return
            except Exception as erro:
                print(f"[ERRO DE EXECUCAO] Falha ao consultar tabela: {erro}")

        print("[INFO] Exibindo registros locais (modo fallback):")
        lista_dicts = [c.to_dict() for c in self.dados_locais]
        if PANDAS_DISPONIVEL:
            print(pd.DataFrame(lista_dicts).to_string(index=False))
        else:
            print(f"{'ID':<4} | {'ELEVADOR':<10} | {'LOCAL':<22} | {'PROBLEMA':<26} | {'STATUS':<12}")
            print("-" * 80)
            for d in lista_dicts:
                print(f"{d['id']:<4} | {d['elevador']:<10} | {d['local']:<22} | {d['problema']:<26} | {d['status']:<12}")

    def inserir(self, chamado):
        conexao = self.conexao_manager.conectar()
        if conexao:
            try:
                cursor = conexao.cursor()
                sql = """
                INSERT INTO chamados_otis (codigo_elevador, local_instalacao, descricao_problema, prioridade, passageiros_presos, status)
                VALUES (:1, :2, :3, :4, :5, :6)
                """
                cursor.execute(sql, (
                    chamado.elevador, chamado.local, chamado.descricao, 
                    chamado.prioridade, chamado.passageiros_presos, chamado.status
                ))
                conexao.commit()
                cursor.close()
                conexao.close()
                print("[OK] Chamado persistido no Banco Oracle com sucesso!")
                return True
            except Exception as erro:
                print(f"[ERRO INESPERADO] Falha ao gravar no Oracle: {erro}")
                return False

        chamado.id = len(self.dados_locais) + 1
        self.dados_locais.append(chamado)
        print(f"[OK] Chamado registrado com sucesso! (ID #{chamado.id})")
        return True

    def atualizar_status(self, id_chamado, novo_status):
        conexao = self.conexao_manager.conectar()
        if conexao:
            try:
                cursor = conexao.cursor()
                cursor.execute("UPDATE chamados_otis SET status = :1 WHERE id_chamado = :2", (novo_status, id_chamado))
                conexao.commit()
                cursor.close()
                conexao.close()
                print("[OK] Status atualizado no banco Oracle!")
                return True
            except Exception as erro:
                print(f"[ERRO INESPERADO] Falha ao atualizar: {erro}")
                return False

        for c in self.dados_locais:
            if c.id == id_chamado:
                c.atualizar_status(novo_status)
                print("[OK] Status atualizado com sucesso!")
                return True

        print("[ERRO DE LOGICA] Chamado nao encontrado.")
        return False

    def excluir(self, id_chamado):
        conexao = self.conexao_manager.conectar()
        if conexao:
            try:
                cursor = conexao.cursor()
                cursor.execute("DELETE FROM chamados_otis WHERE id_chamado = :1", (id_chamado,))
                conexao.commit()
                cursor.close()
                conexao.close()
                print("[OK] Chamado excluido do Oracle!")
                return True
            except Exception as erro:
                print(f"[ERRO INESPERADO] Falha ao excluir: {erro}")
                return False

        inicial = len(self.dados_locais)
        self.dados_locais = [c for c in self.dados_locais if c.id != id_chamado]
        if len(self.dados_locais) < inicial:
            print("[OK] Chamado excluido com sucesso!")
            return True

        print("[ERRO DE LOGICA] ID nao encontrado para exclusao.")
        return False

    def limpar_todos(self):
        self.dados_locais.clear()
        print("[AVISO] Todos os registros locais foram limpos.")


class SistemaChamadosApp:
    """Interface de usuario via console (Clean Code / Single Responsibility)."""

    def __init__(self):
        conexao = ConexaoOracle()
        self.repositorio = ChamadoRepository(conexao)

    def executar(self):
        while True:
            self._exibir_menu()
            opcao = input("Escolha uma opcao (1-6): ").strip()

            if opcao == "1":
                self._cadastrar()
            elif opcao == "2":
                self._listar()
            elif opcao == "3":
                self._atualizar()
            elif opcao == "4":
                self._excluir()
            elif opcao == "5":
                self._limpar()
            elif opcao == "6":
                print("\nEncerrando o sistema HOP. Ate logo!")
                sys.exit(0)
            else:
                print("[ERRO] Opcao invalida. Digite de 1 a 6.")

    def _exibir_menu(self):
        print("\n" + "=" * 52)
        print("      SISTEMA HOP / OTIS - CRUD POO (FASE 7)")
        print("=" * 52)
        print("1. Cadastrar Chamado")
        print("2. Listar Chamados")
        print("3. Alterar Status do Chamado")
        print("4. Excluir Chamado")
        print("5. Excluir Todos os Registros")
        print("6. Sair")
        print("=" * 52)

    def _cadastrar(self):
        print("\n" + "-" * 50)
        print("[+] NOVO CHAMADO DE ELEVADOR")
        print("-" * 50)
        try:
            elevador = input("Codigo do Elevador (ex: ELV-03): ").strip()
            if not elevador:
                raise ValueError("[ERRO SEMANTICO] Codigo do elevador e obrigatorio.")

            local = input("Local de Instalacao (ex: Shopping Morumbi): ").strip()
            problema = input("Descricao do Problema: ").strip()
            presos = input("Ha passageiros presos? (S/N): ").strip().upper()
            if presos not in ("S", "N"):
                raise ValueError("[ERRO SEMANTICO] Responda apenas com 'S' ou 'N'.")

            chamado = Chamado(0, elevador, local, problema, presos)
            self.repositorio.inserir(chamado)
        except ValueError as e:
            print(f"\n{e}")

    def _listar(self):
        print("\n" + "=" * 70)
        print("[LISTAGEM DE CHAMADOS OTIS - HOP]")
        print("=" * 70)
        self.repositorio.listar_todos()

    def _atualizar(self):
        print("\n" + "-" * 50)
        print("[*] ATUALIZAR STATUS DE CHAMADO")
        print("-" * 50)
        try:
            id_chamado = int(input("Digite o ID do chamado: "))
            status = input("Novo Status (ABERTO / EM_ANDAMENTO / CONCLUIDO): ").strip()
            self.repositorio.atualizar_status(id_chamado, status)
        except ValueError as e:
            print(f"\n[ERRO DE ENTRADA] {e}")

    def _excluir(self):
        print("\n" + "-" * 50)
        print("[-] EXCLUIR CHAMADO")
        print("-" * 50)
        try:
            id_chamado = int(input("Digite o ID do chamado para excluir: "))
            self.repositorio.excluir(id_chamado)
        except ValueError as e:
            print(f"\n[ERRO DE ENTRADA] ID deve ser um numero inteiro: {e}")

    def _limpar(self):
        confirma = input("Tem certeza que deseja apagar todos os registros? (S/N): ").strip().upper()
        if confirma == "S":
            self.repositorio.limpar_todos()


if __name__ == "__main__":
    app = SistemaChamadosApp()
    app.executar()
