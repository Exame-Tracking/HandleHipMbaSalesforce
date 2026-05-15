# HandleHipMbaSalesforce.js

Função única exposta em `HandleHipMbaSalesforce` que intercepta o submit de um `<form>`, monta o payload conforme a spec do Salesforce Web-to-Lead e dispara o envio em paralelo com handlers extras (n8n, Zapier, webhooks, etc.).

## Instalação

Sirva o arquivo via CDN (jsDelivr a partir do GitHub) e inclua antes da chamada:

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
| `nivelEnsino`       | `string`                                   | Sim         | Valor do campo `NivelEnsino__c`. Aceita `HIP` ou `MBA Executivo`.                                      |
| `course`            | `string`                                   | Sim         | Valor do campo `Course__c`. Aceita um dos cursos da whitelist (ver abaixo).                            |
| `onSubmit`          | `(payload) => void`                        | Não         | Callback disparado **apenas** se o POST ao Salesforce resolver. Recebe o payload final enviado.        |
| `onValidationError` | `(errors) => void`                         | Não         | Disparado quando a validação interna falha. Recebe `Array<{field, message}>`. Chamado **após** o alert. |
| `onSubmitError`     | `(err) => void`                            | Não         | Disparado quando o POST ao Salesforce rejeita por erro de rede. Chamado **após** o alert.              |
| `extraHandlers`     | `Array<(payload) => Promise>`              | Não         | Funções que rodam em paralelo ao POST do Salesforce. Falhas individuais são logadas e ignoradas.       |

### Valores aceitos por `course`

- `ABP-W`
- `PIACC`
- `SEER`
- `FECC`
- `MBA Executivo em Liderança e Gestão`
- `MBA Executivo em Finanças`

## Campos do form

A função extrai esses `name`s via `FormData`. Todos são obrigatórios (exceto `QuandoPretendeIniciar__c`):

- `first_name`, `last_name`, `email`, `mobile`
- `Cargo__c`, `TempoExperienciaGestao__c`, `NumeroLiderados__c`
- `NomeEmpresaOndeTrabalha__c`, `PerfilLinkedin__c`
- `ComoConheceuSaintPaul__c`, `AreaFormacao__c`
- `QuandoPretendeIniciar__c` (opcional — omitido se vazio)
- `phone_code` (opcional — DDI usado para compor o `mobile` quando o usuário não digita `+`. Ex.: `<select name="phone_code">` com valores como `+55`, `55`, `+1`, etc. Default `+55`.)

Os valores aceitos por cada select estão definidos no início de `HandleHipMbaSalesforce.js` (constantes `CARGO`, `TEMPO_EXPERIENCIA`, etc.) e devem bater exatamente.

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
| Campos obrigatórios                   | Não-vazios após trim.                                                              |
| `first_name`, `last_name`, empresa    | Tags HTML removidas (sanitização).                                                 |
| `email`                               | Formato `x@y.z`, normalizado para lowercase + trim.                                |
| `mobile`                              | Brasil (`+55`): 10–11 dígitos. Internacional: 7–15 dígitos. Sem espaços/traços.    |
| `PerfilLinkedin__c`                   | Deve conter `linkedin.com`.                                                        |
| Selects                               | Valor exato em uma das whitelists.                                                 |

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
