# HandleHipMbaSalesforce.js

Função única exposta em `HandleHipMbaSalesforce` que intercepta o submit de um `<form>`, monta o payload conforme a spec do Salesforce Web-to-Lead e dispara o envio em paralelo com handlers extras (n8n, Zapier, webhooks, etc.).

## Instalação

Sirva o arquivo via CDN (jsDelivr a partir do GitHub) e chame a função dentro do `onload` do script. Veja [Versionamento e CDN (jsDelivr)](#versionamento-e-cdn-jsdelivr) antes de publicar qualquer alteração:

```html
<script>
  document.head.appendChild(Object.assign(document.createElement("script"), {
    src: `https://cdn.jsdelivr.net/gh/Exame-Tracking/HandleHipMbaSalesforce@1/HandleHipMbaSalesforce.min.js?cb=${Math.floor(Date.now() / 600000)}`,
    onload: () => {
      HandleHipMbaSalesforce({
        formId: 'lead-form',
        nivelEnsino: 'MBA Executivo',
        course: 'MBA Executivo em Finanças',
        onSubmit: () => { window.location.href = '/obrigado'; },
      });
    },
  }));
</script>
```

## Versionamento e CDN (jsDelivr)

Não existe build, deploy nem bucket: o jsDelivr serve o arquivo direto do GitHub. O que publica uma
alteração é **criar uma tag no git** — nada além disso.

### Anatomia da URL

```
https://cdn.jsdelivr.net/gh/Exame-Tracking/HandleHipMbaSalesforce@1/HandleHipMbaSalesforce.min.js?cb=…
                         ^  ^                                    ^  ^                            ^
                         gh repo                                 @1 arquivo servido              cache-buster
```

- `gh` — origem GitHub (não npm).
- `@1` — o **seletor de versão**. É a peça que importa, explicada abaixo.
- `HandleHipMbaSalesforce.min.js` — esse arquivo **não existe no repositório**. O jsDelivr minifica o
  `HandleHipMbaSalesforce.js` na hora e serve com source map. Não commite um `.min.js`.
- `?cb=${Math.floor(Date.now() / 600000)}` — bucket de 10 minutos que fura o cache do **navegador**.
  Ele **não** fura o cache do jsDelivr — pra isso existe o purge.

### Seletores de versão

| Seletor           | Resolve para                                   | Cache na edge do jsDelivr |
| ----------------- | ---------------------------------------------- | ------------------------- |
| `@1`              | a última `v1.x.y` — **é o que as LPs usam**     | 7 dias                    |
| `@1.4`            | a última `v1.4.x`                               | 7 dias                    |
| `@1.4.1`          | exatamente essa tag, imutável                   | praticamente pra sempre   |
| sem `@` / `@main` | o branch default                                | 12 horas                  |

O `@1` é um **alias de major**: qualquer tag `v1.x.y` nova que você publicar passa a ser servida por
ele automaticamente, sem tocar em nenhuma LP. É por isso que a URL das LPs é `@1` e não `@1.4.1`.

Nunca aponte uma LP para um branch nem para `@latest` — o conteúdo muda sozinho a cada push e você
perde o controle do que está em produção.

### Como publicar uma alteração

**Commit e push em `main` não mudam absolutamente nada no CDN.** O `@1` olha para tags, não para o
branch. Só existe publicação quando uma tag nova aparece.

**Crie a tag pela interface do GitHub.**

1. Faça o commit e o push em `main` normalmente.
2. Vá em **[Releases → Draft a new release](https://github.com/Exame-Tracking/HandleHipMbaSalesforce/releases/new)**.
3. Em **Choose a tag**, digite a versão nova (`v1.4.2`) e clique em **Create new tag: v1.4.2 on publish**.
4. Confirme que **Target** está em `main` e que o commit ali é o que você acabou de subir.
5. Título igual à tag, descreva em uma linha o que mudou e clique em **Publish release**.
6. Purgue o cache (seção abaixo). **Sem isso a alteração não chega nas LPs.**
7. Confira que subiu, abrindo a URL no navegador (aba anônima)

Padrão das versões: prefixo `v`, três números (`vX.Y.Z`), seguindo as tags que já existem. Qual dos
três aumentar está na tabela do fim desta seção — e o primeiro, praticamente nunca.

### Purge — https://www.jsdelivr.com/tools/purge

Como `@1` é um alias, a edge do jsDelivr continua servindo a versão anterior por **até 7 dias** mesmo
depois de a tag nova existir. O purge força a edge a rebuscar do GitHub na hora.

Cole a URL em https://www.jsdelivr.com/tools/purge e execute. Detalhes que importam:

- Purgue a URL **exatamente como a LP usa**, com `.min.js`. O purge é por URL: purgar o `.js` **não**
  purga o `.min.js`.
- URLs de versão exata (`@1.4.1`) são imutáveis — não precisa e não adianta purgar.
- O `?cb=` do snippet não substitui o purge: ele só evita que o **navegador** reuse o arquivo antigo
  que já baixou. Se a edge ainda tem a versão velha, o navegador recebe a versão velha de novo.
- **Purge é passo obrigatório do release**, não é opcional. Sem ele, a alteração leva dias pra
  aparecer nas LPs — e vai aparecer em horários diferentes em cada edge, o que é pior ainda pra
  debugar.

### Regra de ouro: não mexa no primeiro número

O `@1` está **hardcoded em cada LP**. Trocar para `@2` no repositório não faz nada sozinho: as LPs
continuam baixando a v1 pra sempre. Só passa a valer depois de entrar **LP por LP** e trocar a URL na
mão.

E é exatamente por isso que o major existe. Ele só se justifica quando a mudança **quebra a
implementação anterior** — prop renomeada ou removida, `name` de campo do form alterado,
comportamento default diferente. Nesse cenário você teria que ir de LP em LP de qualquer jeito, pra
ajustar o HTML e o objeto de config; o `@2` só acompanha um trabalho que já era inevitável.

O corolário prático é o mais útil no dia a dia: **se a alteração não obriga a mexer na LP, ela não é
breaking** — é `minor` ou `patch`, e o `@1` distribui sozinho. Então, sempre que der, prefira
retrocompatibilidade a um major: prop nova com default que preserva o comportamento antigo, aceitar o
nome de campo velho **e** o novo, whitelist que ganha valores em vez de trocá-los.

Se um v2 for mesmo inevitável: publique `v2.0.0`, **mantenha o `@1` vivo** (as LPs antigas continuam
funcionando — é justamente o benefício do alias) e migre as LPs aos poucos.

### Quando bumpar o quê

| Bump    | Quando                                        | Exemplo no histórico                                |
| ------- | --------------------------------------------- | --------------------------------------------------- |
| `patch` | correção que não muda o contrato              | `v1.0.2` (`phone_code`), `v1.4.1` (recordType do HIP) |
| `minor` | campo, curso ou prop nova, compatível         | `v1.1.0` (`validateLinkedin`), `v1.3.0` (leads)       |
| `major` | quebra LPs existentes                         | nunca aconteceu — e o ideal é continuar assim         |

## Uso básico

Chame a função **uma vez** após o DOM estar pronto. Ela mesma anexa o listener de `submit` no form e chama `e.preventDefault()`.

```html
<form id="lead-form">
  <input name="first_name" required />
  <input name="last_name" required />
  <input name="email" type="email" required />
  <input name="mobile" required />
  <select name="Cargo__c" required>...</select>
  <select name="TempoExperienciaGestao__c" required>...</select>
  <select name="NumeroLiderados__c" required>...</select>
  <input name="NomeEmpresaOndeTrabalha__c" required />
  <input name="PerfilLinkedin__c" required />
  <select name="ComoConheceuSaintPaul__c" required>...</select>
  <select name="AreaFormacao__c" required>...</select>

  <!-- opcionais: só existem nas LPs de Finanças -->
  <select name="TempoExperienciaFinancas__c">...</select>
  <select name="AtuacaoFinancas__c">...</select>

  <!-- "Qual é o seu nível de responsabilidade atual no cargo?" (múltipla escolha) -->
  <label><input type="checkbox" name="ResponsabilidadeEspecialista__c" /> Especialista</label>
  <label><input type="checkbox" name="ResponsabilidadeCordenacao__c" /> Coordeno projetos/pessoas informalmente</label>
  <label><input type="checkbox" name="ResponsabilidadeNaoLidero__c" /> Não lidero equipe diretamente</label>
  <label><input type="checkbox" name="ResponsabilidadeEquipe__c" /> Lidero outros profissionais / uma equipe</label>
  <label><input type="checkbox" name="ResponsabilidadeGestores__c" /> Lidero outros gestores</label>
  <label><input type="checkbox" name="ResponsabilidadeAreas__c" /> Lidero múltiplas áreas / equipes</label>
  <label><input type="checkbox" name="ResponsabilidadeUnidade__c" /> Lidero uma unidade de negócio / empresa</label>
  <label><input type="checkbox" name="ResponsabilidadeExecutiva__c" /> Tenho responsab. executiva pela função</label>

  <button type="submit">Enviar</button>
</form>

<script>
  HandleHipMbaSalesforce({
    formId: 'lead-form',
    isTest: false,
    nivelEnsino: 'MBA Executivo',
    course: 'MBA Executivo em Finanças',
    onSubmit: () => { window.location.href = '/obrigado'; },
  });
</script>
```

## Parâmetros

A função recebe um único objeto:

| Campo               | Tipo                                       | Obrigatório | Descrição                                                                                              |
|---------------------|--------------------------------------------|-------------|--------------------------------------------------------------------------------------------------------|
| `formId`            | `string`                                   | Sim         | `id` do elemento `<form>` onde o listener será anexado.                                                |
| `isTest`            | `boolean`                                  | Não         | `true` envia para `test.salesforce.com` (homologação). Default `false` (produção).                     |
| `nivelEnsino`       | `string`                                   | Não\*       | Valor default para `NivelEnsino__c`. Aceita `HIP` ou `MBA Executivo`. \*Obrigatório se o form não tiver um campo `NivelEnsino__c` (select ou radio). |
| `course`            | `string`                                   | Não\*       | Valor default para `Course__c`. Aceita um dos cursos da whitelist (ver abaixo). \*Obrigatório se o form não tiver um campo `Course__c` (select ou radio). |
| `onSubmit`          | `(payload) => void`                        | Não         | Callback disparado **apenas** se o POST ao Salesforce resolver. Recebe o payload final enviado.        |
| `onValidationError` | `(errors) => void`                         | Não         | Disparado quando a validação interna falha. Recebe `Array<{field, message}>`. Chamado **após** o alert. |
| `onSubmitError`     | `(err) => void`                            | Não         | Disparado quando o POST ao Salesforce rejeita por erro de rede. Chamado **após** o alert.              |
| `extraHandlers`     | `Array<(payload) => Promise>`              | Não         | Funções que rodam em paralelo ao POST do Salesforce. Falhas individuais são logadas e ignoradas.       |

### Valores aceitos por `course`

- `ABP-W`
- `PIACC`
- `FIAC`
- `SEER`
- `FECC`
- `MBA Executivo em Liderança e Gestão`
- `MBA Executivo em Finanças`
- `Pós-MBA Liderança`
- `Pós-MBA Inteligência Artificial`

### `Course__c` e `NivelEnsino__c` a partir do form

Além dos props `course` e `nivelEnsino`, esses valores também podem vir de campos do próprio form — útil quando o curso ou o nível de ensino são escolhidos pelo usuário em vez de fixados pela página:

```html
<select name="NivelEnsino__c" required>
  <option value="">Selecione…</option>
  <option value="HIP">HIP</option>
  <option value="MBA Executivo">MBA Executivo</option>
</select>

<select name="Course__c" required>
  <option value="">Selecione…</option>
  <option value="MBA Executivo em Finanças">MBA Executivo em Finanças</option>
  <option value="MBA Executivo em Liderança e Gestão">MBA Executivo em Liderança e Gestão</option>
</select>

<!-- ou radio -->
<label><input type="radio" name="Course__c" value="SEER" /> SEER</label>
<label><input type="radio" name="Course__c" value="FECC" /> FECC</label>
```

Precedência: **se o form tiver um valor não-vazio para o campo, ele vence**; o prop correspondente é o fallback. O valor final continua sendo validado contra a whitelist.

## Campos do form

A função extrai esses `name`s via `FormData`:

- `first_name`, `last_name`, `email`, `mobile`
- `Cargo__c`, `TempoExperienciaGestao__c`, `NumeroLiderados__c`
- `NomeEmpresaOndeTrabalha__c`, `PerfilLinkedin__c`
- `ComoConheceuSaintPaul__c`, `AreaFormacao__c`
- `TempoExperienciaFinancas__c`, `AtuacaoFinancas__c` (opcionais — usados nas LPs de Finanças; mesma mecânica dos demais selects)
- `NivelEnsino__c` (opcional — se presente como select ou radio, sobrescreve o prop `nivelEnsino`)
- `Course__c` (opcional — se presente como select ou radio, sobrescreve o prop `course`)
- `QuandoPretendeIniciar__c` (omitido do payload se vazio)
- `phone_code` (DDI usado para compor o `mobile` quando o usuário não digita `+`. Ex.: `<select name="phone_code">` com valores como `+55`, `55`, `+1`, etc. Default `+55`.)

### Nível de responsabilidade (checkboxes → `Sim`/`Não`)

A pergunta "Qual é o seu nível de responsabilidade atual no cargo?" aceita mais de uma opção, e cada opção é um campo próprio no Salesforce:

| `name` no form                    | Opção                                        |
|-----------------------------------|----------------------------------------------|
| `ResponsabilidadeEspecialista__c` | Especialista                                 |
| `ResponsabilidadeCordenacao__c`   | Coordeno projetos/pessoas informalmente      |
| `ResponsabilidadeNaoLidero__c`    | Não lidero equipe diretamente                |
| `ResponsabilidadeEquipe__c`       | Lidero outros profissionais / uma equipe     |
| `ResponsabilidadeGestores__c`     | Lidero outros gestores                       |
| `ResponsabilidadeAreas__c`        | Lidero múltiplas áreas / equipes             |
| `ResponsabilidadeUnidade__c`      | Lidero uma unidade de negócio / empresa      |
| `ResponsabilidadeExecutiva__c`    | Tenho responsab. executiva pela função       |

Regras:

- Marcado vai como `"Sim"`, **desmarcado vai como `"Não"`** — o campo é enviado nos dois casos.
- **Só é enviado o que existe no HTML.** Se a LP não tem o checkbox, o campo não entra no payload (LPs antigas continuam com o payload idêntico ao de antes).
- Diferente dos selects, esses campos são lidos direto do DOM — `FormData` só enxerga checkbox marcado, e aí não dá pra distinguir "desmarcado" de "não existe no form".
- O `value` do checkbox é irrelevante: o que conta é o estado `checked`. Se a opção for renderizada como `input hidden`/`select` em vez de checkbox, vale o `value` não-vazio.
- Não passam por whitelist — o valor é gerado pelo próprio JS.
- ⚠️ `required` num checkbox **não** é pego pela checagem de obrigatoriedade (o `value` de um checkbox desmarcado continua sendo `"on"`). Para exigir pelo menos uma escolha, valide no próprio HTML/LP.

**Obrigatoriedade é controlada pelo HTML.** Qualquer `<input>`, `<select>` ou `<textarea>` marcado com o atributo `required` será validado como obrigatório; os demais são opcionais. Não há lista hardcoded no JS — para tornar um campo obrigatório ou opcional, basta adicionar/remover `required` no markup.

Os valores aceitos por cada select estão definidos no início de `HandleHipMbaSalesforce.js` (constantes `CARGO`, `TEMPO_EXPERIENCIA`, etc.) e devem bater exatamente — essa validação de whitelist roda independentemente de o campo ser `required` ou não.

## O que a função adiciona ao payload automaticamente

- `oid` e `recordType`: conforme `isTest` (produção vs homologação).
- `lead_source`: `Website Formulary`.
- `LandingPageURL__c`: `window.location.href` no momento do submit.
- `UTM_SOURCE__c`, `UTM_MEDIUM__c`, `UTM_CAMPAIGN__c`, `UTM_CONTENT__c`, `UTM_TERM__c`: lidos da query string da URL atual (string vazia se ausentes).

## Validação

A função aplica todas as regras antes de enviar. Se algo falhar:

- Log no console: `console.warn('[salesforceWebToLead] validation failed', errors)`.
- Cada `<input>`/`<select>` correspondente aos campos inválidos recebe `outline: 2px solid #ef4444; outline-offset: 2px` via inline style + atributo `data-sf-error="1"`. O destaque é limpo automaticamente no início do próximo submit.
- `alert('Formulário inválido. Verifique os campos destacados e tente novamente.')` é disparado ao usuário **sempre** — independente de callback.
- `onValidationError(errors)` é chamado em seguida (se fornecido), permitindo ao caller mostrar erros inline e resetar UI.
- Nenhum POST é feito (nem Salesforce, nem extras).
- `onSubmit` não é chamado.

Regras aplicadas:

| Campo                                 | Regra                                                                              |
|---------------------------------------|------------------------------------------------------------------------------------|
| Campos com `required` no HTML         | Não-vazios após trim.                                                              |
| `first_name`, `last_name`, empresa    | Tags HTML removidas (sanitização).                                                 |
| `email`                               | Formato `x@y.z`, normalizado para lowercase + trim.                                |
| `mobile`                              | Brasil (`+55`): 10–11 dígitos. Internacional: 7–15 dígitos. Sem espaços/traços.    |
| `PerfilLinkedin__c`                   | Deve conter `linkedin.com` ou `lnkd.in`, sem diferenciar maiúsculas/minúsculas.    |
| Selects                               | Valor exato em uma das whitelists.                                                 |
| Checkboxes `Responsabilidade*__c`     | Sem whitelist — o JS gera `Sim`/`Não` a partir do `checked`.                        |

Se o usuário digita o telefone sem DDI (ex.: `11999998888`), a função usa o valor do `<select name="phone_code">` (se existir e tiver valor) para compor o DDI. Aceita formatos como `+55` ou `55` — só os dígitos são considerados. Se o select não existir ou estiver vazio, usa `+55` como fallback. Se o usuário já digitou o telefone com `+`, o `phone_code` é ignorado e o valor digitado é preservado.

## `extraHandlers` — envios paralelos

Cada função no array recebe o payload final (após validação e sanitização) e roda em paralelo ao POST do Salesforce. Falhas são silenciadas (log via `console.error`) e **não afetam** o envio principal nem o `onSubmit`.

```js
HandleHipMbaSalesforce({
  formId: 'lead-form',
  nivelEnsino: 'MBA Executivo',
  course: 'MBA Executivo em Finanças',
  extraHandlers: [
    (payload) => fetch('https://hook.n8n.io/...', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    (payload) => fetch('https://hooks.zapier.com/...', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    (payload) => {
      window.dataLayer?.push({ event: 'lead_submitted', email: payload.email });
    },
  ],
  onSubmit: () => { window.location.href = '/obrigado'; },
});
```

## Tratamento de erros

| Cenário                              | Comportamento                                                                                                |
|--------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `formId` não encontrado no DOM       | `console.error` e a função retorna sem instalar listener.                                                    |
| Validação falha                      | `console.warn` + outline vermelho nos campos inválidos + `alert('Formulário inválido...')` + `onValidationError(errors)` (se fornecido). Nada é enviado. |
| `extraHandler` rejeita ou joga       | `console.error` com o índice e o erro. Demais envios continuam normalmente.                                  |
| POST ao Salesforce falha (rede)      | `console.error` + `alert('Não foi possível enviar...')` + `onSubmitError(err)` (se fornecido).               |

## Exemplo completo (produção + tracking)

```html
<script>
  document.head.appendChild(Object.assign(document.createElement("script"), {
    src: `https://cdn.jsdelivr.net/gh/Exame-Tracking/HandleHipMbaSalesforce@1/HandleHipMbaSalesforce.min.js?cb=${Math.floor(Date.now() / 600000)}`,
    onload: () => {
      HandleHipMbaSalesforce({
        formId: 'lead-form',
        isTest: false,
        nivelEnsino: 'HIP',
        course: 'SEER',
        extraHandlers: [
          (payload) => fetch('https://webhook.site/abc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }),
        ],
        onSubmit: (payload) => {
          console.log('lead enviado', payload);
          window.location.href = '/obrigado';
        },
      });
    },
  }));
</script>
```

## Exemplo (homologação para QA)

```js
HandleHipMbaSalesforce({
  formId: 'lead-form',
  isTest: true,
  nivelEnsino: 'MBA Executivo',
  course: 'MBA Executivo em Finanças',
  onSubmit: (payload) => console.log('payload enviado (homolog)', payload),
});
```

## Notas

- O fetch ao Salesforce usa `mode: 'no-cors'` porque o servlet não responde CORS. A resposta vira opaca (status `0`), o que é esperado — o request é entregue mesmo assim. Por isso só falhas de rede são detectáveis, não erros lógicos do Salesforce.
- A função pode ser chamada antes ou depois do form existir, mas o form precisa estar no DOM no momento da chamada (caso contrário cai no log de "form não encontrado").
- `retURL` não é enviado. O fluxo de redirect fica por conta do `onSubmit`.
