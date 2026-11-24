# Integração Supabase — Simulado Direito do Trabalho

## O que esta estrutura prepara

- Cadastro/autenticação por e-mail e senha (com confirmação obrigatória).
- Perfil com nome público; e-mail não aparece no ranking.
- Registro de várias tentativas.
- Ranking público que considera somente a melhor nota por conta; desempate pelo menor tempo e, depois, pela data mais antiga.
- Edge Function que valida a identidade e calcula os acertos no servidor.
- GitHub Actions para publicar migrações e a função quando os segredos forem configurados.

## 1. Criar o projeto

Crie um projeto em https://supabase.com/dashboard. Guarde:
- Project URL
- Project Reference ID (o identificador do projeto na URL)
- Publishable key (ou anon key legada)
- Database password (somente para GitHub Actions)

Não coloque a senha do banco nem a secret/service_role key no HTML ou em arquivos públicos.

## 2. Configurar autenticação

No Supabase, abra Authentication / Providers / Email:
- habilite Email provider;
- mantenha Confirm email ativado;
- defina Site URL como `https://thallesmgt4.github.io/simulado-direito-trabalho/` (se você estiver usando o endereço padrão do GitHub Pages);
- adicione essa mesma URL em Redirect URLs, incluindo a página inicial do site;
- confirme que a opção de confirmação de e-mail está ativada.

O envio padrão de e-mails do Supabase tem limite baixo e é indicado para testes. Para uso real, configure SMTP próprio no Supabase.

## 3. Conectar o GitHub Actions

No repositório GitHub, abra Settings / Secrets and variables / Actions e crie:
- SUPABASE_ACCESS_TOKEN: token pessoal criado no painel Supabase;
- SUPABASE_PROJECT_REF: Project Reference ID;
- SUPABASE_DB_PASSWORD: senha do banco definida ao criar o projeto.

Depois de adicionar os três secrets, execute Actions / Deploy Supabase / Run workflow. O workflow aplica a migração e publica a Edge Function. Não adicione a service_role key aos secrets do GitHub: a função usa a variável protegida do ambiente Supabase.

## 4. Front-end conectado

O arquivo `index.html` já está conectado ao projeto `gvzsguoppaehjntalcbm` com a Publishable key pública. O simulado exige cadastro/login e confirmação do e-mail; a nota é enviada à Edge Function e o ranking público exibe somente nome, nota, tempo e data.

A URL do projeto é `https://gvzsguoppaehjntalcbm.supabase.co`. A Publishable key fica no HTML porque é uma chave pública; a segurança depende das políticas RLS e da validação no servidor. Nunca coloque a secret/service_role key no navegador.

Ainda é necessário concluir a configuração de autenticação no painel Supabase, criar os três secrets do GitHub Actions e executar o workflow antes de o ranking gravar resultados. O endereço padrão esperado do site é `https://thallesmgt4.github.io/simulado-direito-trabalho/`; se houver domínio personalizado ou URL diferente, use a URL real do site nas configurações de autenticação.

## Observações de segurança

- A nota é calculada na Edge Function com gabarito no servidor.
- A tabela de tentativas não permite gravação direta pelo navegador.
- O ranking expõe apenas nome, pontuação, tempo e data; nunca e-mail.
- O limite de uma identidade é por conta autenticada. Uma pessoa ainda poderia criar outra conta com outro e-mail; e-mail verificado não prova identidade civil única.
