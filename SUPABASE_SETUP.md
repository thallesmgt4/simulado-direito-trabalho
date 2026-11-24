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
- defina Site URL com a URL publicada do GitHub Pages;
- adicione a mesma URL em Redirect URLs, incluindo a página inicial do site.

O envio padrão de e-mails do Supabase tem limite baixo e é indicado para testes. Para uso real, configure SMTP próprio no Supabase.

## 3. Conectar o GitHub Actions

No repositório GitHub, abra Settings / Secrets and variables / Actions e crie:
- SUPABASE_ACCESS_TOKEN: token pessoal criado no painel Supabase;
- SUPABASE_PROJECT_REF: Project Reference ID;
- SUPABASE_DB_PASSWORD: senha do banco definida ao criar o projeto.

Depois de adicionar os três secrets, execute Actions / Deploy Supabase / Run workflow. O workflow aplica a migração e publica a Edge Function. Não adicione a service_role key aos secrets do GitHub: a função usa a variável protegida do ambiente Supabase.

## 4. Configuração que falta no front-end

O HTML ainda não foi conectado nem alterado para exigir cadastro, pois precisamos inserir o Project URL e a Publishable key corretos do seu projeto. Esses dois valores são públicos por definição e podem ser usados no front-end com RLS ativo. Nunca use secret/service_role key no navegador.

Depois de criar o projeto, envie somente:
- Project URL;
- Project Reference ID;
- Publishable key (ou anon key).

Nunca envie a senha do banco, senha de usuário, token pessoal ou service_role/secret key.

## Observações de segurança

- A nota é calculada na Edge Function com gabarito no servidor.
- A tabela de tentativas não permite gravação direta pelo navegador.
- O ranking expõe apenas nome, pontuação, tempo e data; nunca e-mail.
- O limite de uma identidade é por conta autenticada. Uma pessoa ainda poderia criar outra conta com outro e-mail; e-mail verificado não prova identidade civil única.
