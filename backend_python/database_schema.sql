-- DDL para criação das tabelas no Oracle SQL Developer
-- Capítulo 6: Python e sua conexão com o Banco de Dados (Fase 7)

CREATE TABLE chamados_otis (
    id_chamado NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_elevador VARCHAR2(20) NOT NULL,
    local_instalacao VARCHAR2(100) NOT NULL,
    descricao_problema VARCHAR2(255) NOT NULL,
    prioridade VARCHAR2(20) DEFAULT 'MEDIA',
    passageiros_presos CHAR(1) DEFAULT 'N',
    status VARCHAR2(20) DEFAULT 'ABERTO',
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE elevadores_otis (
    codigo_elevador VARCHAR2(20) PRIMARY KEY,
    modelo VARCHAR2(50) NOT NULL,
    edificio VARCHAR2(100) NOT NULL,
    status_operacional VARCHAR2(20) DEFAULT 'ATIVO'
);

-- Dados iniciais para testes
INSERT INTO elevadores_otis (codigo_elevador, modelo, edificio, status_operacional) 
VALUES ('ELV-01', 'Gen2 Life', 'Torre Paulista', 'ATIVO');

INSERT INTO elevadores_otis (codigo_elevador, modelo, edificio, status_operacional) 
VALUES ('ELV-02', 'SkyRise High-Speed', 'Hospital Santa Joana', 'MANUTENCAO');

COMMIT;
