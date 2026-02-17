#!/bin/bash
set -e

# Este script é executado quando o container inicia
# A variável POSTGRES_DB já cria o banco, mas isso garante

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- Database será criado automaticamente pela variável POSTGRES_DB
  -- Este script é apenas para garantir inicialização
  SELECT 'Database initialized' as status;
EOSQL
