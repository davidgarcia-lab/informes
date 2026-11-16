(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const form = byId('third-form');
  const panel = byId('third-panel');
  const report = byId('third-document');
  const pages = byId('print-pages');
  const status = byId('third-status');
  const baseTitle = document.title;
  const field = name => form.elements.namedItem(name);
  const value = (name, placeholder) => field(name).value.trim() || '[' + placeholder + ']';
  const date = (name, placeholder) => value(name, placeholder).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1');
  const photoGroups = [
    {input: field('annex2Photos'), wrapper: byId('third-annex2-photos-field'), title: 'Anexo 2 · Solicitud de designación', enabled: () => field('will').value === 'yes' && field('annex2').checked},
    {input: field('annex3Photos'), wrapper: byId('third-annex3-photos-field'), title: 'Anexo 3 · Declaración jurada', enabled: () => field('will').value === 'yes' && field('annex3').checked},
    {input: field('photos'), wrapper: byId('third-photos-field'), title: 'Evidencia fotográfica de la visita', enabled: () => field('evidence').value === 'yes'}
  ].map(group => ({...group, images: [], request: 0}));
  const signatureInput = field('signature');
  const signaturePreview = byId('third-signature-preview');
  const signatureStatus = byId('third-signature-status');
  let signature = '';
  let signatureRequest = 0;

  field('responsible').append(...Array.from(byId('promoter').options, option => option.cloneNode(true)));

  function paragraph(text, className = '') {
    const p = document.createElement('p');
    p.className = className;
    p.textContent = text;
    report.append(p);
    return p;
  }

  function render() {
    report.replaceChildren();
    const user = value('user', 'NOMBRE DEL USUARIO');
    const dni = value('dni', 'DNI USUARIO');
    const person = value('person', 'NOMBRE DEL TERCERO AUTORIZADO');
    const personDni = value('personDni', 'DNI DEL TERCERO');
    const location = `${value('settlement', 'CENTRO POBLADO')}, distrito de ${value('district', 'DISTRITO')}, provincia de ${value('province', 'PROVINCIA')}`;
    const relation = field('relation').value === 'otro' ? value('otherRelation', 'PARENTESCO O VÍNCULO') : value('relation', 'PARENTESCO O VÍNCULO');
    const will = field('will').value;
    const observation = field('observation').value.trim();
    const confirmedWill = will === 'yes';

    window.P65ReportFormat.header(report, {
      number: value('number', 'NÚMERO DE INFORME'),
      reference: 'Expediente ' + value('file', 'NÚMERO DE EXPEDIENTE'),
      subject: `Sobre visita domiciliaria para designación de tercera persona autorizada del/de la usuario(a) ${user}, con DNI ${dni}, del centro poblado ${location}.`,
      date: date('date', 'FECHA DEL INFORME')
    });
    paragraph('Me dirijo a usted para saludarlo cordialmente y, a la vez, informar sobre la visita domiciliaria realizada para verificar la necesidad de designación de tercera persona autorizada para el cobro de la subvención económica del Programa Pensión 65.');
    paragraph(`Con fecha ${date('visit', 'FECHA DE VISITA')}, se realizó la visita domiciliaria al/a la usuario(a) ${user}, identificado(a) con DNI N.° ${dni}, de ${value('age', 'EDAD')} años de edad, domiciliado(a) en ${location}. La visita se realizó en ${value('address', 'DIRECCIÓN DE LA VISITA')}.`);
    paragraph('').append(bold('En la visita domiciliaria se evidenció lo siguiente:'));
    paragraph(value('findings', 'HECHOS OBSERVADOS DURANTE LA VISITA'), 'report-facts');

    const proposedPerson = `${person}, identificado(a) con DNI N.° ${personDni}, quien es su ${relation}, con domicilio en ${value('home', 'DOMICILIO DEL TERCERO')}.`;
    if (confirmedWill) {
      paragraph(`Durante la diligencia, se verificó que el/la usuario(a) expresó su voluntad de designar como tercera persona autorizada a ${proposedPerson}`);
    } else if (will === 'no') {
      paragraph('Durante la diligencia, el/la usuario(a) no expresó su voluntad de designar a una tercera persona autorizada para el cobro de su subvención económica.');
    }
    if (observation) paragraph(observation, 'report-facts');
    if (confirmedWill) {
      if (field('annex3').checked) {
        paragraph('Mediante la declaración jurada correspondiente, la persona propuesta asume el compromiso de efectuar el cobro de la subvención económica y entregarla de manera íntegra y oportuna al/a la usuario(a).');
      }
      paragraph(`De lo expuesto, se concluye que el/la usuario(a) ${user}, con DNI N.° ${dni}, requiere la designación de ${person}, con DNI N.° ${personDni}, como tercera persona autorizada para el cobro de su subvención económica.`);
      paragraph('Se recomienda continuar con el trámite de designación de tercera persona autorizada a favor de la persona propuesta, previa verificación del cumplimiento de los requisitos establecidos por el Programa Pensión 65.');
    } else if (will === 'no') {
      paragraph(`De lo expuesto, se emite opinión desfavorable y se recomienda denegar la designación de una tercera persona autorizada para el cobro de la subvención económica del/de la usuario(a) ${user}, con DNI N.° ${dni}, debido a que no expresó su voluntad de efectuar dicha designación.`);
    }

    const documents = document.createElement('ul');
    documents.className = 'report-annex-list';
    documents.setAttribute('role', 'list');
    if (confirmedWill && field('annex2').checked) documentLine(documents, 'Anexo 2', 'Solicitud de designación de tercera persona autorizada.');
    if (confirmedWill && field('annex3').checked) documentLine(documents, 'Anexo 3', 'Declaración jurada de tercera persona autorizada.');
    if (field('evidence').value === 'yes') documentLine(documents, 'Evidencia fotográfica', 'Fotografías de la visita domiciliaria.');
    if (documents.childElementCount) {
      paragraph('Se adjuntan los documentos de sustento:');
      report.append(documents);
    }
    window.P65ReportFormat.signoff(report, value('responsible', 'NOMBRE DEL RESPONSABLE'), signature);
    report.lastElementChild.append(
      document.createElement('br'), 'UNIDAD TERRITORIAL JUNÍN'
    );
    for (const group of photoGroups) {
      if (!group.enabled()) continue;
      group.images.forEach((image, index) => {
        const section = document.createElement('section');
        section.className = 'report-annex report-annex-full';
        const heading = document.createElement('h3');
        heading.textContent = `${group.title} · Foto ${index + 1}`;
        const figure = document.createElement('figure');
        image.alt = heading.textContent;
        figure.append(image);
        section.append(heading, figure);
        report.append(section);
      });
    }
  }

  function bold(text) {
    const strong = document.createElement('strong');
    strong.textContent = text;
    return strong;
  }

  function documentLine(list, label, description) {
    const item = document.createElement('li');
    const bullet = document.createElement('span');
    bullet.className = 'report-annex-bullet';
    bullet.setAttribute('aria-hidden', 'true');
    bullet.textContent = '• ';
    item.append(bullet, bold(label + ':'), ' ' + description);
    list.append(item);
  }

  function update() {
    byId('third-relation-field').hidden = field('otherRelation').disabled = field('relation').value !== 'otro';
    for (const group of photoGroups) {
      group.wrapper.hidden = group.input.disabled = !group.enabled();
    }
    const denied = field('will').value === 'no';
    const personSection = byId('third-person-section');
    personSection.hidden = personSection.disabled = denied;
    byId('third-annex-checks').hidden = field('annex2').disabled = field('annex3').disabled = denied;
    signatureInput.disabled = !field('responsible').value;
    signaturePreview.hidden = !signature;
    const image = signaturePreview.querySelector('img');
    if (signature) image.src = signature;
    else image.removeAttribute('src');
    const reportDate = field('date');
    reportDate.min = field('visit').value;
    for (const control of form.querySelectorAll('input:not([type]), textarea')) {
      control.setCustomValidity(control.required && control.value && !control.value.trim() ? 'Ingrese un valor válido.' : '');
    }
    pages.replaceChildren();
    render();
  }

  function clearSignature(message = '') {
    signatureRequest++;
    signature = '';
    signatureInput.value = '';
    signatureStatus.textContent = message;
  }

  form.addEventListener('input', event => {
    if (event.target === field('responsible')) clearSignature(signature ? 'Se retiró la firma al cambiar de promotor.' : '');
    update();
  });
  byId('third-signature-remove').addEventListener('click', () => {
    clearSignature('Firma retirada.');
    update();
  });
  signatureInput.addEventListener('change', async () => {
    const file = signatureInput.files[0];
    if (!file) return;
    const request = ++signatureRequest;
    signatureStatus.textContent = 'Cargando firma…';
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
        throw new Error('Seleccione una imagen PNG, JPG o WebP de hasta 2 MB.');
      }
      const image = new Image();
      image.src = await readImage(file);
      await image.decode();
      if (request !== signatureRequest) return;
      signature = image.src;
      signatureStatus.textContent = 'Firma cargada.';
    } catch (error) {
      if (request !== signatureRequest) return;
      signatureInput.value = '';
      signatureStatus.textContent = error.message?.startsWith('Seleccione') ? error.message : 'No se pudo abrir la imagen de la firma.';
    }
    update();
  });

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  for (const group of photoGroups) {
    const photos = group.input;
    photos.addEventListener('change', async () => {
      const request = ++group.request;
      const files = Array.from(photos.files);
      group.images = [];
      photos.setCustomValidity(files.length ? 'Espere a que se carguen las fotografías.' : '');
      update();
      try {
        const limit = photos.multiple ? 6 : 1;
        if (files.length > limit) throw new Error(photos.multiple ? 'Seleccione hasta seis fotografías.' : 'Seleccione una sola fotografía.');
        const loaded = [];
        for (const file of files) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
            throw new Error('Seleccione imágenes JPG, PNG o WebP de hasta 20 MB cada una.');
          }
          const source = new Image();
          source.src = await readImage(file);
          await source.decode();
          if (request !== group.request) return;
          const scale = Math.min(1, 2400 / Math.max(source.naturalWidth, source.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
          const context = canvas.getContext('2d');
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          const image = new Image();
          image.src = canvas.toDataURL('image/jpeg', 0.92);
          await image.decode();
          loaded.push(image);
        }
        if (request !== group.request) return;
        group.images = loaded;
        photos.setCustomValidity('');
      } catch (error) {
        if (request !== group.request) return;
        photos.value = '';
        photos.setCustomValidity(error.message?.startsWith('Seleccione') ? error.message : 'No se pudo abrir una de las fotografías.');
        photos.reportValidity();
      }
      update();
    });
  }

  function filename() {
    const number = field('number').value.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(0, 100);
    return 'Informe de terceros autorizados - ' + number;
  }

  function preparePrint() {
    const valid = form.checkValidity();
    window.P65Print.build(report, valid);
    if (valid) document.title = filename();
  }

  window.addEventListener('beforeprint', () => {
    if (!panel.hidden) preparePrint();
  });
  byId('third-print').addEventListener('click', () => {
    if (!form.reportValidity()) return;
    preparePrint();
    try {
      window.print();
    } finally {
      document.title = baseTitle;
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = byId('third-pdf');
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    status.textContent = 'Preparando el PDF…';
    try {
      preparePrint();
      await window.P65PDF.download(pages, filename());
      status.textContent = 'PDF descargado.';
    } catch {
      status.textContent = 'No se pudo generar el PDF.';
    } finally {
      document.title = baseTitle;
      button.disabled = false;
    }
  });

  byId('third-copy').addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    const text = [...report.children].filter(node => node.tagName !== 'HR')
      .map(node => node.classList.contains('report-meta')
        ? [...node.children].map(child => child.innerText).join(' ')
        : node.innerText).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Texto del informe copiado.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(report);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Informe seleccionado. Presione Ctrl+C para copiar.';
    }
  });

  form.addEventListener('reset', () => {
    clearSignature();
    for (const group of photoGroups) {
      group.request++;
      group.images = [];
      group.input.setCustomValidity('');
    }
    status.textContent = '';
    queueMicrotask(update);
  });
  update();
})();
