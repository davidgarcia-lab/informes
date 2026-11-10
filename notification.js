(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const field = name => byId('notice-' + name);
  const form = byId('notification-form');
  const panel = byId('notification-panel');
  const preview = field('document');
  const pages = byId('print-pages');
  const baseTitle = document.title;
  const signatureInput = field('signature');
  const signatureStatus = field('signature-status');
  let signature = '';
  let signatureRequest = 0;
  const annexes = [
    {input: field('letter-photo'), title: 'Anexo 1', description: 'Cargo de recepción de la carta firmada.'},
    {input: field('voucher-photo'), title: 'Anexo 2', description: 'Comprobante de depósito de la devolución.'}
  ];
  const currency = new Intl.NumberFormat('es-PE', {style: 'currency', currency: 'PEN'});
  const hasDeposit = () => field('case').value === 'deposit';
  const hasDifficulty = () => field('difficulty').value === 'yes';
  const activeAnnexes = () => hasDeposit() ? annexes : annexes.slice(0, 1);
  const value = (name, placeholder) => field(name).value.trim() || '[' + placeholder + ']';
  const date = (name, placeholder) => value(name, placeholder).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1');

  field('promoter').replaceChildren(...Array.from(byId('promoter').options, option => option.cloneNode(true)));

  for (const type of ['affiliation', 'notification']) {
    byId('show-' + type).addEventListener('click', () => {
      for (const option of ['affiliation', 'notification']) {
        byId(option + '-panel').hidden = option !== type;
        byId('show-' + option).setAttribute('aria-pressed', String(option === type));
      }
      pages.replaceChildren();
    });
  }

  function render() {
    const deceased = value('deceased', 'NOMBRE DE LA PERSONA FALLECIDA');
    const deceasedDni = value('deceased-dni', 'DNI DE LA PERSONA FALLECIDA');
    const recipient = value('recipient', 'NOMBRE DE QUIEN RECIBIÓ');
    const recipientDni = value('recipient-dni', 'DNI DE QUIEN RECIBIÓ');
    const relationship = field('relationship').value;
    const relationshipText = relationship === 'Sin parentesco'
      ? 'sin parentesco con el exusuario fallecido'
      : `${relationship.toLocaleLowerCase('es-PE') || '[PARENTESCO]'} del exusuario fallecido`;
    const letter = value('letter', 'NÚMERO DE CARTA');
    const noticeDate = date('date', 'FECHA DE NOTIFICACIÓN');
    preview.replaceChildren();

    function paragraph(content, className = '') {
      const p = document.createElement('p');
      p.className = className;
      p.textContent = content;
      preview.append(p);
      return p;
    }

    const fileNumber = field('file-number').value.trim();
    window.P65ReportFormat.header(preview, {
      number: value('number', 'NÚMERO DE INFORME'),
      reference: fileNumber ? 'Expediente ' + fileNumber : 'Carta N.° ' + letter,
      subject: `INFORME DE NOTIFICACIÓN POR COBRO INDEBIDO DE SUBVENCIÓN ECONÓMICA – EXUSUARIO FALLECIDO ${deceased.toLocaleUpperCase('es-PE')}, DNI N.° ${deceasedDni}`,
      date: date('report-date', 'FECHA DEL INFORME')
    });
    paragraph(`Me dirijo a usted para saludarlo cordialmente e informar sobre la notificación de la Carta N.° ${letter}, relacionada con el cobro indebido de la subvención económica del Programa Pensión 65, correspondiente al exusuario fallecido ${deceased}, identificado con DNI ${deceasedDni}.`);
    paragraph(`Con fecha ${noticeDate}, se notificó la citada carta al Sr./Sra. ${recipient}, identificado(a) con DNI ${recipientDni}, ${relationshipText}, quien recibió el documento y firmó el cargo de recepción.`);

    if (hasDeposit()) {
      const amount = field('amount');
      const formatted = amount.value && amount.validity.valid ? currency.format(amount.valueAsNumber) : 'S/ [MONTO DEL DEPÓSITO]';
      paragraph(`Posteriormente, la persona notificada presentó el comprobante de depósito por ${formatted}, efectuado el ${date('deposit-date', 'FECHA DEL DEPÓSITO')}, correspondiente a la devolución del monto cobrado indebidamente.`);
    }

    if (hasDifficulty()) {
      paragraph('Durante la diligencia se presentó la siguiente dificultad: ' + value('details', 'DESCRIPCIÓN DE LA DIFICULTAD'), 'report-facts');
    } else if (field('difficulty').value === 'no') {
      paragraph('Durante la diligencia no se presentaron dificultades.');
    }

    paragraph('Se adjuntan los documentos de sustento:');
    const annexList = document.createElement('ul');
    annexList.className = 'report-annex-list';
    annexList.setAttribute('role', 'list');
    for (const {title, description} of activeAnnexes()) {
      const item = document.createElement('li');
      // The PDF exporter reads text nodes, so the bullet must be part of the DOM.
      const bullet = document.createElement('span');
      bullet.className = 'report-annex-bullet';
      bullet.setAttribute('aria-hidden', 'true');
      bullet.textContent = '•';
      const label = document.createElement('strong');
      label.textContent = title + ':';
      item.append(bullet, label, ' ' + description);
      annexList.append(item);
    }
    preview.append(annexList);
    paragraph('Es todo cuanto informo para su conocimiento y fines pertinentes.');
    window.P65ReportFormat.signoff(preview, value('promoter', 'NOMBRE DEL PROMOTOR'), signature);

    for (const {image, title, description} of activeAnnexes()) {
      if (!image) continue;
      const section = document.createElement('section');
      section.className = 'report-annex report-annex-full';
      const label = document.createElement('h3');
      label.textContent = title + ' · ' + description;
      const figure = document.createElement('figure');
      figure.append(image);
      section.append(label, figure);
      preview.append(section);
    }
  }

  function update() {
    signatureInput.disabled = !field('promoter').value;
    field('signature-preview-wrap').hidden = !signature;
    if (signature) field('signature-preview').src = signature;
    else field('signature-preview').removeAttribute('src');
    field('deposit').hidden = field('deposit').disabled = !hasDeposit();
    field('voucher-field').hidden = field('voucher-photo').disabled = !hasDeposit();
    field('details-field').hidden = field('details').disabled = !hasDifficulty();
    for (const control of form.querySelectorAll('input[required]:not([type]), textarea[required]')) {
      control.setCustomValidity(control.value && !control.value.trim() ? 'Ingrese un valor válido.' : '');
    }
    const depositDate = field('deposit-date');
    const noticeDate = field('date').value;
    const reportDate = field('report-date');
    depositDate.setCustomValidity(noticeDate && depositDate.value && depositDate.value < noticeDate ?
      'La fecha del depósito debe ser igual o posterior a la fecha de notificación.' : '');
    const lastDate = hasDeposit() ? depositDate.value || noticeDate : noticeDate;
    reportDate.setCustomValidity(lastDate && reportDate.value && reportDate.value < lastDate ?
      'La fecha del informe debe ser igual o posterior a la última actuación.' : '');
    pages.replaceChildren();
    render();
  }

  form.addEventListener('input', event => {
    if (event.target.type === 'file') return;
    if (event.target === field('promoter')) {
      clearSignature(signature ? 'Se retiró la firma al cambiar de promotor.' : '');
    }
    field('status').textContent = '';
    update();
  });

  function readPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function clearSignature(message = '') {
    signatureRequest++;
    signature = '';
    signatureInput.value = '';
    signatureStatus.className = 'field-help';
    signatureStatus.textContent = message;
  }

  signatureInput.addEventListener('change', async () => {
    const file = signatureInput.files[0];
    if (!file || signatureInput.disabled) return;
    const request = ++signatureRequest;
    signatureStatus.className = 'field-help';
    signatureStatus.textContent = 'Cargando firma…';
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
        throw new Error('Seleccione una imagen PNG, JPG o WebP de hasta 2 MB.');
      }
      const image = new Image();
      image.src = await readPhoto(file);
      await image.decode();
      if (request !== signatureRequest) return;
      signature = image.src;
      signatureStatus.textContent = 'Firma cargada. Aparecerá en el informe y en el PDF.';
      update();
    } catch (error) {
      if (request !== signatureRequest) return;
      signatureInput.value = '';
      signatureStatus.className = 'field-error';
      signatureStatus.textContent = error.message?.startsWith('Seleccione') ? error.message : 'No se pudo abrir la imagen. Seleccione otra imagen válida.';
    }
  });

  field('remove-signature').addEventListener('click', () => {
    clearSignature('Firma retirada.');
    update();
  });

  for (const annex of annexes) {
    annex.input.addEventListener('change', async () => {
      const file = annex.input.files[0];
      annex.image = null;
      annex.input.setCustomValidity(file ? 'Espere a que termine de cargarse la imagen.' : '');
      update();
      if (!file) return;
      try {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
          throw new Error('Seleccione una imagen JPG, PNG o WebP de hasta 20 MB.');
        }
        const image = new Image();
        image.src = await readPhoto(file);
        await image.decode();
        if (annex.input.files[0] !== file) return;
        const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        image.src = canvas.toDataURL('image/jpeg', 0.92);
        await image.decode();
        if (annex.input.files[0] !== file) return;
        image.alt = annex.description;
        annex.image = image;
        annex.input.setCustomValidity('');
      } catch (error) {
        if (annex.input.files[0] !== file) return;
        const message = error.message?.startsWith('Seleccione') ? error.message : 'No se pudo leer la imagen. Seleccione otra foto.';
        annex.input.value = '';
        annex.input.setCustomValidity(message);
        annex.input.reportValidity();
      }
      update();
    });
  }

  function filename() {
    const number = field('number').value.replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(0, 100);
    return 'Informe de notificación - ' + number;
  }

  function preparePrint() {
    const valid = Array.from(form.elements).every(control => !control.willValidate || control.validity.valid);
    window.P65Print.build(preview, valid);
    if (valid) document.title = filename();
  }

  window.addEventListener('beforeprint', () => {
    if (!panel.hidden) preparePrint();
  });
  field('print').addEventListener('click', () => {
    if (!form.reportValidity()) return;
    preparePrint();
    try {
      window.print();
    } catch {
      field('status').textContent = 'No se pudo abrir la impresión. Use Descargar PDF para guardar el informe.';
    } finally {
      document.title = baseTitle;
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (field('pdf').disabled || !form.reportValidity()) return;
    field('pdf').disabled = true;
    field('status').textContent = 'Preparando el PDF…';
    try {
      preparePrint();
      await window.P65PDF.download(pages, filename());
      field('status').textContent = 'PDF descargado.';
    } catch {
      field('status').textContent = 'No se pudo generar el PDF. Intente descargarlo nuevamente.';
    } finally {
      document.title = baseTitle;
      field('pdf').disabled = false;
    }
  });

  form.addEventListener('reset', () => {
    clearSignature();
    for (const annex of annexes) {
      annex.input.setCustomValidity('');
      annex.image = null;
    }
    field('status').textContent = '';
    queueMicrotask(update);
  });

  update();
})();
