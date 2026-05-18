const HandleHipMbaSalesforce = ({ formId, isTest = false, nivelEnsino, course, onSubmit, onValidationError, onSubmitError, extraHandlers = [] }) => {
  const ENDPOINTS = {
    prod: 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
    test: 'https://test.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
  };

  const CREDS = {
    prod: { oid: '00Das0000070OmN', recordType: '012U600000GTule' },
    test: { oid: '00DHZ0000066iir', recordType: '012HZ000006nrm6' },
  };

  const LEAD_SOURCE = 'Website Formulary';

  const NIVEL_ENSINO = ['HIP', 'MBA Executivo'];

  const COURSE = [
    'ABP-W',
    'PIACC',
    'SEER',
    'FECC',
    'MBA Executivo em Liderança e Gestão',
    'MBA Executivo em Finanças',
  ];

  const CARGO = [
    'Advogado(a)',
    'Analista',
    'Assessor(a)',
    'Assistente',
    'Auditor(a)',
    'Auxiliar',
    'CEO',
    'C-Level (CFO, CMO, CIO, CTO ou outro)',
    'Comprador(a)',
    'Conselheiro(a)',
    'Consultor(a)',
    'Controller',
    'Coordenador(a)',
    'Diretor(a)',
    'Diretor(a) Executivo(a)',
    'Economista',
    'Empreendedor(a)',
    'Engenheiro(a)',
    'Especialista',
    'Estagiário(a)',
    'Gerente',
    'Gerente Geral',
    'Head de unidades de negócio',
    'Herdeiro(a)/Sucessor(a)',
    'Operador(a)',
    'Operador(a) Junior',
    'Operador(a) Pleno',
    'Operador(a) Senior',
    'Outros',
    'Presidente',
    'Secretário(a)',
    'Sócio/Dono/Proprietário(a)',
    'Superintendente',
    'Supervisor(a)',
    'Tesoureiro(a)',
    'Trainee',
    'Vendedor(a)',
    'Vice-presidente',
  ];

  const TEMPO_EXPERIENCIA = [
    '0 a 2 anos',
    '3 a 5 anos',
    '6 a 8 anos',
    '9 a 15 anos',
    '16 a 20 anos',
    '21 a 25 anos',
    '26 a 30 anos',
    'Mais de 30 anos',
  ];

  const NUMERO_LIDERADOS = ['1 a 20', '21 a 50', '51 a 100', 'Mais de 100'];

  const COMO_CONHECEU = [
    'ABRH-SP',
    'Cursos Gratuitos',
    'Editora Saint Paul',
    'E-mail Marketing',
    'Evento CHRO Forum',
    'Facebook',
    'Faria Lima Elevator',
    'Feiras | Eventos',
    'Google',
    'Indicação',
    'Instagram',
    'Linkedin',
    'Outros',
    'Outros sites',
    'Parceiros | Intranet | Empresa',
    'Sou ex-aluno',
    'The Shift',
    'Valor Econômico',
  ];

  const AREA_FORMACAO = [
    'Administração de Empresas',
    'Agronomia',
    'Arquitetura',
    'Atuárias',
    'Biologia',
    'Ciência da Computação',
    'Ciências Contábeis e Atuárias',
    'Ciências Econômicas',
    'Comércio Exterior',
    'Comunicação Social',
    'Desenho Industrial',
    'Design de Interiores',
    'Design Gráfico',
    'Designer de Moda',
    'Direito',
    'Economia',
    'Engenharias',
    'Ensino Médio',
    'Estatística',
    'Física',
    'Fisioterapia',
    'Gastronomia',
    'Gerenciamento de Pequenas e Médias Empresas',
    'Gestão Bancária',
    'Hotelaria',
    'Informática',
    'Jornalismo',
    'Letras',
    'Marketing',
    'Matemática',
    'Medicina',
    'Medicina Veterinária',
    'Odontologia',
    'Outros',
    'Psicologia',
    'Publicidade e Propaganda',
    'Relações Internacionais',
    'Relações Publicas',
    'Secretariado',
    'Serviço Social',
    'Sistemas',
    'Tecnólogo',
    'Turismo',
    'Zootecnia',
  ];

  const REQUIRED_FIELDS = [
    'first_name',
    'last_name',
    'email',
    'mobile',
    'Cargo__c',
    'TempoExperienciaGestao__c',
    'NumeroLiderados__c',
    'NomeEmpresaOndeTrabalha__c',
    'PerfilLinkedin__c',
    'ComoConheceuSaintPaul__c',
    'AreaFormacao__c',
  ];

  const sanitizeHTML = (str) => (typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : '');

  const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const normalizeMobile = (str, phoneCode) => {
    if (typeof str !== 'string') return '';
    let cleaned = str.replace(/[^\d+]/g, '');
    if (cleaned.indexOf('+') > 0) cleaned = cleaned.replace(/\+/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    const code = (phoneCode || '').toString().replace(/[^\d]/g, '');
    const prefix = code || '55';
    return `+${prefix}${cleaned}`;
  };

  const isValidMobile = (str) => {
    if (!str || !str.startsWith('+')) return false;
    const digits = str.slice(1);
    if (!/^\d+$/.test(digits)) return false;
    if (digits.startsWith('55')) {
      const br = digits.slice(2);
      return br.length >= 10 && br.length <= 11;
    }
    return digits.length >= 7 && digits.length <= 15;
  };

  const isLinkedinUrl = (str) => typeof str === 'string' && str.includes('linkedin.com');

  const getUTMs = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      UTM_SOURCE__c: params.get('utm_source') || '',
      UTM_MEDIUM__c: params.get('utm_medium') || '',
      UTM_CAMPAIGN__c: params.get('utm_campaign') || '',
      UTM_CONTENT__c: params.get('utm_content') || '',
      UTM_TERM__c: params.get('utm_term') || '',
    };
  };

  const readForm = (form) => {
    const out = {};
    new FormData(form).forEach((value, key) => {
      out[key] = typeof value === 'string' ? value : '';
    });
    return out;
  };

  const buildPayload = (values, env) => {
    const { oid, recordType } = CREDS[env];
    const payload = {
      oid,
      recordType,
      lead_source: LEAD_SOURCE,
      IsWebtoLead__c: true,
      NivelEnsino__c: nivelEnsino,
      Course__c: course,
      LandingPageURL__c: window.location.href,
      ...getUTMs(),
      first_name: sanitizeHTML(values.first_name),
      last_name: sanitizeHTML(values.last_name),
      email: (values.email || '').trim().toLowerCase(),
      mobile: normalizeMobile(values.mobile || '', values.phone_code),
      Cargo__c: (values.Cargo__c || '').trim(),
      TempoExperienciaGestao__c: (values.TempoExperienciaGestao__c || '').trim(),
      NumeroLiderados__c: (values.NumeroLiderados__c || '').trim(),
      NomeEmpresaOndeTrabalha__c: sanitizeHTML(values.NomeEmpresaOndeTrabalha__c),
      PerfilLinkedin__c: (values.PerfilLinkedin__c || '').trim(),
      ComoConheceuSaintPaul__c: (values.ComoConheceuSaintPaul__c || '').trim(),
      AreaFormacao__c: (values.AreaFormacao__c || '').trim(),
    };

    const quando = (values.QuandoPretendeIniciar__c || '').trim();
    if (quando) payload.QuandoPretendeIniciar__c = quando;

    return payload;
  };

  const validate = (payload) => {
    const errors = [];

    for (const field of REQUIRED_FIELDS) {
      if (!payload[field] || !String(payload[field]).trim()) {
        errors.push({ field, message: 'Campo obrigatório' });
      }
    }

    if (payload.email && !isValidEmail(payload.email)) {
      errors.push({ field: 'email', message: 'E-mail inválido' });
    }

    if (payload.mobile && !isValidMobile(payload.mobile)) {
      errors.push({ field: 'mobile', message: 'Telefone inválido' });
    }

    if (payload.PerfilLinkedin__c && !isLinkedinUrl(payload.PerfilLinkedin__c)) {
      errors.push({ field: 'PerfilLinkedin__c', message: 'URL deve conter linkedin.com' });
    }

    const whitelist = [
      ['NivelEnsino__c', NIVEL_ENSINO],
      ['Course__c', COURSE],
      ['Cargo__c', CARGO],
      ['TempoExperienciaGestao__c', TEMPO_EXPERIENCIA],
      ['NumeroLiderados__c', NUMERO_LIDERADOS],
      ['ComoConheceuSaintPaul__c', COMO_CONHECEU],
      ['AreaFormacao__c', AREA_FORMACAO],
    ];
    for (const [name, allowed] of whitelist) {
      const v = payload[name];
      if (v && !allowed.includes(v)) {
        errors.push({ field: name, message: `Valor não permitido: ${v}` });
      }
    }

    return errors;
  };

  const omitEmpty = (payload) =>
    Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== ''));

  const clearErrorOutlines = (form) => {
    form.querySelectorAll('[data-sf-error]').forEach((el) => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.removeAttribute('data-sf-error');
    });
  };

  const highlightErrors = (form, errors) => {
    errors.forEach((err) => {
      const field = form.querySelector('[name="' + err.field + '"]');
      if (field) {
        field.style.outline = '2px solid #ef4444';
        field.style.outlineOffset = '2px';
        field.setAttribute('data-sf-error', '1');
      }
    });
  };

  const form = document.getElementById(formId);
  if (!form) {
    console.error(`[salesforceWebToLead] form não encontrado: ${formId}`);
    return;
  }

  const env = isTest ? 'test' : 'prod';
  const endpoint = ENDPOINTS[env];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrorOutlines(form);

    const values = readForm(form);
    const payload = buildPayload(values, env);
    const errors = validate(payload);

    if (errors.length > 0) {
      console.warn('[salesforceWebToLead] validation failed', errors);
      highlightErrors(form, errors);
      alert('Formulário inválido. Verifique os campos destacados e tente novamente.');
      if (typeof onValidationError === 'function') onValidationError(errors);
      return;
    }

    const cleanPayload = omitEmpty(payload);
    const body = new URLSearchParams(cleanPayload).toString();

    const sfPromise = fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const extraPromises = extraHandlers.map((fn, i) =>
      Promise.resolve()
        .then(() => fn(cleanPayload))
        .catch((err) => console.error(`[salesforceWebToLead] extraHandler[${i}] falhou`, err)),
    );

    try {
      await sfPromise;
      await Promise.all(extraPromises);
      if (typeof onSubmit === 'function') onSubmit(cleanPayload);
    } catch (err) {
      console.error('[salesforceWebToLead] envio ao Salesforce falhou', err);
      alert('Não foi possível enviar o formulário. Tente novamente.');
      if (typeof onSubmitError === 'function') onSubmitError(err);
    }
  });
};
