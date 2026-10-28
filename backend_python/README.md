# Módulo Python & Conexão Oracle (Capítulo 6 - Fase 7)

Este módulo atende integralmente ao conteúdo do Capítulo 6 da Fase 7:
- Conexão com banco Oracle usando `cx_Oracle` e visualização tabular com `pandas`.
- Tratamento de Erros categorizados:
  - **Erro Sintático**: entrada de tipos incorretos (`ValueError`).
  - **Erro Semântico**: valores em desacordo com as regras de negócio.
  - **Erro Lógico**: consultas a IDs inexistentes.
  - **Erro Circunstancial**: indisponibilidade de rede ou falha no servidor Oracle.
- Script SQL DDL em `database_schema.sql`.
- Modo de demonstração com fallback local automático.

## Como Executar
```bash
pip install -r requirements.txt
python app_crud_oracle.py
```
