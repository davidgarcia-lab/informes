'use strict';
(() => {
  const catalogue = [];
  function group(category, name, labels) {
    labels.forEach(label => catalogue.push({ id: String(catalogue.length), category, group: name, label }));
  }
  group('FUNCIONAL', '', ['Discapacidad severa de movimiento']);
  group('VULNERABILIDAD FÍSICA', 'Deficiencias nutricionales', ['Anemia']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedad pulmonar', ['Asma bronquial', 'Enfermedad pulmonar obstructiva crónica (EPOC)', 'Fibrosis pulmonar']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedades cardiovasculares', ['Arritmia cardiaca', 'Cardiopatía reumática', 'Hipertensión arterial', 'Insuficiencia cardiaca']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedades de aparato digestivo', ['Colonostomía', 'Fístula']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedades de órganos de los sentidos', ['Cataratas', 'Ceguera', 'Glaucoma', 'Hipoacusia severa', 'Otitis media crónica', 'Sordomudo']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedades endocrinas', ['Diabetes', 'Hipotiroidismo e hipertiroidismo']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedades genitourinarias', ['Ectasia renal bilateral', 'Hipertrofia prostática', 'Insuficiencia renal']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedades neurológicas', ['Alzheimer', 'Amnesia', 'Demencia senil', 'Derrame cerebral / cerebrovascular', 'Embolia cerebral', 'Hemiplejia', 'Parkinson', 'Retardo mental']);
  group('VULNERABILIDAD FÍSICA', 'Enfermedades osteomusculares y del tejido conectivo', ['Deformidad severa de aparato locomotor', 'Espondilosis', 'Fracturas patológicas', 'Gangrena', 'Otras']);
  group('VULNERABILIDAD FÍSICA', 'Infecciosas', ['Diarrea crónica', 'Hepatitis B y C', 'SIDA', 'Tuberculosis']);
  group('VULNERABILIDAD FÍSICA', 'No intencionales', ['Accidentes de tránsito', 'Caídas', 'Quemaduras']);
  group('VULNERABILIDAD FÍSICA', 'Traumatismo', ['Pérdida de órganos']);
  group('VULNERABILIDAD FÍSICA', 'Tumores malignos (cáncer)', ['Boca-orofaringe', 'Bronquios y pulmón', 'Colon/recto', 'Cuello del útero', 'Cuerpo del útero', 'Estómago', 'Hígado', 'Laringe', 'Leucemia', 'Linfoma', 'Mama', 'Otros tumores malignos', 'Ovario', 'Páncreas', 'Próstata', 'Riñón', 'Tiroides', 'Tumores de piel no melanoma', 'Vejiga', 'Vesícula (vías biliares)']);
  group('VULNERABILIDAD MENTAL', 'Enfermedades neuropsiquiátricas', ['Abuso de alcohol y dependencia', 'Depresión unipolar', 'Enfermedad de las neuronas motoras', 'Esquizofrenia', 'Otras neuropsiquiátricas']);
  group('VULNERABILIDAD SOCIAL', 'Dependencia familiar', ['Carga familiar']);
  group('VULNERABILIDAD SOCIAL', 'Edad', ['Mayor de 90 años']);
  group('VULNERABILIDAD SOCIAL', 'Personas en abandono', ['Sin protección familiar']);
  group('VULNERABILIDAD SOCIAL', 'Subsistencia de la caridad', ['Indigentes']);
  group('VULNERABILIDAD SOCIAL', 'Víctimas de terrorismo', ['Desplazados']);

  const $ = id => document.getElementById(id);
  const promoters = ['ALVAREZ ZARATE, ABEL', 'CARDENAS ASTUPILLO, MARLINI YUDI'];
  const recommendations = {
    'priorizar':'Priorizar la afiliación del potencial usuario al Programa Pensión 65 por vulnerabilidad identificada durante la visita domiciliaria, sujeto al cumplimiento de los requisitos exigidos.',
    'no-priorizar':'No priorizar la afiliación del potencial usuario al Programa Pensión 65, de acuerdo con los hechos descritos durante la visita domiciliaria.'
  };
  const baseDocumentTitle=document.title;
  const fields = ['promoter','reportNumber','fileNumber','fullName','dni','age','reportDate','visitDate','settlement','district','province','recommendation','facts'];
  const labels = { promoter:'Nombre del promotor', reportNumber:'Número de informe', fileNumber:'Número de expediente', fullName:'Nombre completo del potencial usuario', dni:'DNI', age:'Edad', reportDate:'Fecha del informe', visitDate:'Fecha de visita domiciliaria', settlement:'Centro poblado', district:'Distrito', province:'Provincia', recommendation:'Recomendación', facts:'Hechos observados durante la visita', vulnerability:'Vulnerabilidad identificada - SISOPE' };
  const storageKey = 'p65-promotor-visita-v1';
  let selected = null, attempted = false, storageAvailable = true;
  let signatureData = '', signatureFor = '', signatureLoadId = 0;
  const photoSlots = Array.from({length:6}, () => ({data:'', original:'', turns:0, request:0, loading:false}));
  const maxPhotoDataLength = 220000;
  labels.evidenceCount = 'Evidencia fotográfica';
  const includesEvidence = () => $('includeEvidence').value === 'yes';
  const evidenceCount = () => includesEvidence() ? Number($('evidenceCount').value) : 0;
  const touched = new Set();
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const pad = num => String(num).padStart(2,'0');
  function makeDate(year, month, day) { const d = new Date(0); d.setHours(12,0,0,0); d.setFullYear(year,month,day); return d; }
  function parseDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;
    const day=Number(match[1]), month=Number(match[2])-1, year=Number(match[3]);
    if (year < 1) return null;
    const date=makeDate(year,month,day);
    return date.getFullYear()===year && date.getMonth()===month && date.getDate()===day ? date : null;
  }
  const formatDate = date => `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${String(date.getFullYear()).padStart(4,'0')}`;
  function errors() {
    const result={};
    fields.forEach(id => { if (!$(id).value.trim()) result[id]=`Complete ${id==='dni' ? 'DNI' : labels[id].toLowerCase()}.`; });
    if ($('promoter').value && !promoters.includes($('promoter').value)) result.promoter='Seleccione al promotor del listado.';
    if (!Object.hasOwn(recommendations,$('recommendation').value)) result.recommendation='Seleccione Priorizar o No priorizar.';
    if ($('dni').value && !/^[0-9]{8}$/.test($('dni').value)) result.dni='El DNI debe tener exactamente 8 dígitos.';
    if ($('age').validity.badInput || ($('age').value && !/^\d+$/.test($('age').value))) result.age='Ingrese una edad válida en años enteros.';
    ['reportDate','visitDate'].forEach(id => { if ($(id).value && !parseDate($(id).value)) result[id]='Ingrese una fecha válida en formato dd/mm/yyyy.'; });
    if (!selected) result.vulnerability='Seleccione una vulnerabilidad del listado SISOPE.';
    if (includesEvidence()) {
      const count=evidenceCount();
      const activePhotos=photoSlots.slice(0,count);
      if (!count) result.evidenceCount='Seleccione cuántas fotos adjuntará.';
      else if (activePhotos.some(photo=>photo.loading)) result.evidenceCount='Espere a que se carguen las fotos.';
      else if (activePhotos.some(photo=>!photo.data)) result.evidenceCount='Adjunte las fotos que faltan para completar la cantidad seleccionada.';
    }
    return result;
  }
  function showErrors(all=false) {
    const issues=errors();
    Object.keys(labels).forEach(id => {
      const show=(all || touched.has(id)) && issues[id];
      $(id+'-error').textContent=show || '';
      if (show) $(id).setAttribute('aria-invalid','true'); else $(id).removeAttribute('aria-invalid');
    });
    const summary=$('validation-summary');
    summary.replaceChildren();
    summary.hidden=!(attempted && Object.keys(issues).length);
    if (!summary.hidden) {
      const p=document.createElement('p');p.textContent='Complete o corrija estos campos antes de copiar o imprimir:';
      const list=document.createElement('ul');
      Object.keys(issues).forEach(id => { const item=document.createElement('li'), link=document.createElement('a');link.href='#'+id;link.textContent=labels[id];link.addEventListener('click', event=>{event.preventDefault();$(id).focus();});item.append(link);list.append(item); });
      summary.append(p,list);
    }
    return issues;
  }
  function save() {
    if (!storageAvailable) return;
    const data={};fields.forEach(id=>data[id]=$(id).value);data.selectedId=selected?.id ?? null;
    data.signatureData=signatureData;data.signatureFor=signatureFor;
    data.includeEvidence=$('includeEvidence').value;
    data.evidenceCount=$('evidenceCount').value;
    data.photos=photoSlots.map(photo=>photo.data);
    try { sessionStorage.setItem(storageKey,JSON.stringify(data)); } catch { storageAvailable=false; }
  }
  function restore() {
    try {
      const data=JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (!data || typeof data!=='object') return;
      fields.forEach(id=>{if (typeof data[id]==='string') $(id).value=data[id];});
      selected=catalogue.find(item=>item.id===data.selectedId) || null;
      if (selected) $('vulnerability').value=selected.label;
      if (promoters.includes($('promoter').value) && data.signatureFor===$('promoter').value && typeof data.signatureData==='string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.signatureData) && data.signatureData.length<3000000) {
        signatureData=data.signatureData;signatureFor=data.signatureFor;
      }
      if (data.includeEvidence==='yes') $('includeEvidence').value='yes';
      if (/^[1-6]$/.test(data.evidenceCount)) $('evidenceCount').value=data.evidenceCount;
      if (Array.isArray(data.photos)) {
        photoSlots.forEach((photo,index)=>{
          const image=data.photos[index];
          if (typeof image==='string' && image.length<=maxPhotoDataLength && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image)) {
            photo.data=image;
            photo.original=image;
          }
        });
      }
    } catch { /* A fresh form remains available if browser storage is unavailable. */ }
  }
  function showMeta() {
    const meta=$('selection-meta');meta.replaceChildren();meta.hidden=!selected;
    if (!selected) return;
    const category=document.createElement('strong');category.textContent=selected.category;meta.append(category);
    meta.append(document.createTextNode(' · Grupo: '+(selected.group || 'No especificado en el listado')));
  }
  function renderReport() {
    const value=(id,placeholder)=>$(id).value.trim() || `[${placeholder}]`;
    const reportDate=parseDate($('reportDate').value) ? $('reportDate').value : '[FECHA DEL INFORME]';
    const visitDate=parseDate($('visitDate').value) ? $('visitDate').value : '[FECHA DE VISITA DOMICILIARIA]';
    const name=value('fullName','NOMBRE COMPLETO'), dni=value('dni','DNI'), settlement=value('settlement','CENTRO POBLADO'), district=value('district','DISTRITO'), province=value('province','PROVINCIA');
    const doc=$('report-document');doc.replaceChildren();
    function paragraph(text, className, boldPrefix) {
      const p=document.createElement('p');if(className)p.className=className;
      if(boldPrefix){const strong=document.createElement('strong');strong.textContent=boldPrefix;p.append(strong,document.createTextNode(text));} else p.textContent=text;
      doc.append(p);return p;
    }
    function metadata(label, text, className='') {
      const p=paragraph('', 'report-meta '+className);
      const key=document.createElement('strong');key.className='meta-label';key.textContent=label;
      const value=document.createElement('span');value.className='meta-value';value.textContent=text;
      p.append(key,value);return value;
    }
    const letterhead=paragraph('', 'report-letterhead');
    window.P65Print.headerLines.forEach((line,i)=>{if(i)letterhead.append(document.createElement('br'));letterhead.append(document.createTextNode(line));});
    const heading=paragraph('', 'report-number');const strong=document.createElement('strong');strong.textContent=`INFORME N° ${value('reportNumber','NÚMERO DE INFORME')}`;heading.append(strong);
    const recipientDetails=metadata('A:', '', 'report-recipient');
    const recipientName=document.createElement('strong');recipientName.textContent='DAVID DANY GARCIA VENTOCILLA';recipientDetails.append(recipientName,document.createElement('br'),document.createTextNode('Coordinador Territorial'),document.createElement('br'),document.createTextNode('Unidad Territorial Junín'));
    metadata('REFERENCIA:', 'Expediente '+value('fileNumber','NÚMERO DE EXPEDIENTE'), 'report-reference');
    metadata('ASUNTO:', `Sobre visita domiciliaria a potencial usuario ${name} con DNI ${dni}, centro poblado ${settlement}, distrito ${district}, provincia ${province}.`, 'report-subject');
    metadata('FECHA:', reportDate, 'report-date');
    const divider=document.createElement('hr');divider.className='report-divider';doc.append(divider);
    paragraph('Me dirijo a usted, para saludarlo cordialmente y a la vez informar sobre la visita domiciliaria realizada al potencial usuario.');
    paragraph(`Con fecha ${visitDate}, se realizó la visita domiciliaria de verificación al potencial usuario ${name}, identificado con DNI ${dni}, de ${value('age','EDAD')} años de edad, domiciliado en ${settlement}, distrito de ${district}, provincia de ${province}.`);
    paragraph('En la visita domiciliaria se evidenció lo siguiente:\n'+($('facts').value || '[HECHOS OBSERVADOS DURANTE LA VISITA]'), 'report-facts');
    const condition=selected ? [selected.category,selected.group,selected.label].filter(Boolean).join(' / ') : '[CATEGORÍA SISOPE] / [GRUPO SISOPE] / [VULNERABILIDAD SELECCIONADA]';
    paragraph(`De lo expuesto, se concluye que el potencial usuario presenta vulnerabilidad de condición ${condition}.`);
    paragraph('', 'report-recommendations', 'RECOMENDACIONES:');
    paragraph(Object.hasOwn(recommendations,$('recommendation').value) ? recommendations[$('recommendation').value] : '[RECOMENDACIÓN SELECCIONADA]');
    const signoff=paragraph('Atentamente,', 'report-signoff');signoff.append(document.createElement('br'),document.createElement('br'));
    if (signatureData && signatureFor===$('promoter').value) { const image=document.createElement('img');image.src=signatureData;image.alt='Firma del promotor';image.className='report-signature';signoff.append(image); }
    signoff.append(document.createTextNode('Promotor del Programa Pensión 65'),document.createElement('br'));
    const promoterName=document.createElement('strong');promoterName.textContent=value('promoter','NOMBRE DEL PROMOTOR');signoff.append(promoterName);
    appendPhotoAnnexes(doc);
    const count=Object.keys(errors()).length;
    $('completion-state').textContent=count ? 'Completa los datos' : 'Listo para copiar';
    $('completion-state').classList.toggle('ready',!count);
    document.body.classList.toggle('print-ready',!count);
    $('pdf-filename').hidden=!!count;
    $('pdf-filename').textContent=count?'':'Nombre sugerido del PDF: '+pdfFilename()+'.pdf';
  }
  function pdfFilename() {
    const name=$('fullName').value.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/g,'').slice(0,140);
    return 'Informe de afiliación - '+(name||'USUARIO')+' - DNI '+$('dni').value;
  }
  function preparePrintDocument() {
    const valid=!Object.keys(errors()).length;
    const count=$('print-pages').children.length || window.P65Print.build($('report-document'),valid);
    if(valid)document.title=pdfFilename();
    return count;
  }
  window.addEventListener('beforeprint',preparePrintDocument);
  window.addEventListener('afterprint',()=>{document.title=baseDocumentTitle;});
  function status(text,kind='') { const el=$('action-status');el.textContent=text;el.className=kind; }
  function update() { $('print-pages').replaceChildren();renderReport();showErrors(attempted);save();status('El informe se actualiza mientras escribes.'); }
  fields.forEach(id=> {
    $(id).addEventListener('input',()=>{
      if (id==='promoter') {
        if(signatureFor!==$('promoter').value) { const hadSignature=!!signatureData;clearSignature();$('signature-status').textContent=hadSignature?'Se retiró la firma al cambiar de promotor. Puede cargar la firma correspondiente.':''; }
        syncSignature();
      }
      if (id==='dni') $(id).value=$(id).value.replace(/[^0-9]/g,'').slice(0,8);
      if (id==='reportDate'||id==='visitDate') {
        const digits=$(id).value.replace(/[^0-9]/g,'').slice(0,8);
        $(id).value=digits.slice(0,2)+(digits.length>2?'/'+digits.slice(2,4):'')+(digits.length>4?'/'+digits.slice(4):'');
      }
      update();
    });
    $(id).addEventListener('blur',()=>{touched.add(id);showErrors(attempted);});
  });

  function syncSignature() {
    const available=!!signatureData && signatureFor===$('promoter').value;
    $('signature').disabled=!promoters.includes($('promoter').value);
    $('signature-preview-wrap').hidden=!available;
    if(available) $('signature-preview').src=signatureData;else $('signature-preview').removeAttribute('src');
  }
  function clearSignature() { signatureLoadId++;signatureData='';signatureFor='';$('signature').value='';syncSignature(); }
  $('signature').addEventListener('change',async()=>{
    const file=$('signature').files[0], promoter=$('promoter').value, loadId=++signatureLoadId;
    if(!file)return;
    const message=$('signature-status');message.className='field-help';
    if(!promoters.includes(promoter))return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024) {
      message.textContent='Seleccione una imagen PNG, JPG o WebP de hasta 2 MB.';message.className='field-error';$('signature').value='';return;
    }
    message.textContent='Cargando firma…';
    try {
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.naturalWidth&&image.naturalHeight?resolve():reject();image.onerror=reject;image.src=data;});
      if(loadId!==signatureLoadId||promoter!==$('promoter').value)return;
      signatureData=data;signatureFor=promoter;syncSignature();update();message.textContent='Firma cargada. Aparecerá en el informe y en la impresión.';
    } catch {
      if(loadId!==signatureLoadId)return;
      message.textContent='No se pudo abrir la imagen. Seleccione otra imagen válida.';message.className='field-error';$('signature').value='';
    }
  });
  $('remove-signature').addEventListener('click',()=>{clearSignature();$('signature-status').textContent='Firma retirada.';update();});

  function appendPhotoAnnexes(doc) {
    const count=evidenceCount();
    for (let start=0;start<count;start+=2) {
      const page=document.createElement('section');
      page.className='report-annex';
      const heading=document.createElement('h3');
      heading.textContent='ANEXO FOTOGRÁFICO';
      page.append(heading);
      for (let index=start;index<Math.min(start+2,count);index++) {
        if (!photoSlots[index].data) continue;
        const figure=document.createElement('figure');
        const image=document.createElement('img');
        const caption=document.createElement('figcaption');
        caption.textContent=`Fotografía ${index+1}`;
        image.alt=`Evidencia de la visita, fotografía ${index+1}`;
        image.src=photoSlots[index].data;
        figure.append(image,caption);
        page.append(figure);
      }
      if (page.children.length>1) doc.append(page);
    }
  }

  async function readEvidencePhoto(file) {
    const url=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
    return encodeEvidencePhoto(url);
  }

  async function encodeEvidencePhoto(url, turns=0) {
    const image=new Image();
    image.src=url;
    await image.decode();
    const canvas=document.createElement('canvas');
    const context=canvas.getContext('2d');
    let scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    // Bound each image so six photos and the signature fit in the local draft.
    for (let attempt=0;attempt<8;attempt++) {
      const width=Math.max(1,Math.round(image.naturalWidth*scale));
      const height=Math.max(1,Math.round(image.naturalHeight*scale));
      const swapAxes=turns%2===1;
      canvas.width=swapAxes?height:width;
      canvas.height=swapAxes?width:height;
      context.fillStyle='#fff';
      context.fillRect(0,0,canvas.width,canvas.height);
      context.translate(canvas.width/2,canvas.height/2);
      context.rotate(turns*Math.PI/2);
      context.drawImage(image,-width/2,-height/2,width,height);
      for (const quality of [0.86,0.74,0.62]) {
        const data=canvas.toDataURL('image/jpeg',quality);
        if (data.length<=maxPhotoDataLength) return data;
      }
      scale*=0.8;
    }
    throw new Error('La foto supera el tamaño disponible.');
  }

  async function rotateEvidencePhoto(photo, direction) {
    const turns=(photo.turns+direction+4)%4;
    const request=++photo.request;
    photo.loading=true;
    photo.message.textContent='Girando foto…';
    syncEvidence();update();
    try {
      const data=turns ? await encodeEvidencePhoto(photo.original,turns) : photo.original;
      if (photo.request!==request) return;
      photo.data=data;
      photo.turns=turns;
      photo.message.textContent='Giro aplicado a la vista previa y al anexo.';
    } catch {
      if (photo.request!==request) return;
      photo.message.textContent='No se pudo girar la foto. Vuelva a intentarlo.';
    }
    photo.loading=false;
    syncEvidence();update();
  }

  function syncEvidence() {
    const count=evidenceCount();
    $('evidence-count-field').hidden=!includesEvidence();
    $('evidence-uploads').hidden=!count;
    photoSlots.forEach((photo,index)=>{
      photo.card.hidden=index>=count;
      photo.image.hidden=!photo.data;
      photo.remove.hidden=!photo.data;
      photo.rotators.forEach(button=>{button.hidden=!photo.data;button.disabled=photo.loading;});
      photo.upload.textContent=photo.data?'Reemplazar foto':'Cargar foto';
      photo.upload.setAttribute('aria-label',`${photo.data?'Reemplazar':'Cargar'} fotografía ${index+1}`);
      if (!photo.data) photo.image.removeAttribute('src');
      else if (photo.image.getAttribute('src')!==photo.data) photo.image.src=photo.data;
    });
    const loaded=photoSlots.slice(0,count).filter(photo=>photo.data).length;
    $('evidence-progress').textContent=count ? `${loaded} de ${count} fotos cargadas` : '';
  }

  photoSlots.forEach((photo,index)=>{
    const number=index+1;
    const card=document.createElement('div');card.className='photo-slot';
    const label=document.createElement('strong');label.className='photo-slot-title';label.textContent=`Fotografía ${number}`;
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;
    const upload=document.createElement('button');upload.type='button';upload.className='button button-secondary';
    const image=document.createElement('img');image.alt=`Vista previa de fotografía ${number}`;
    const remove=document.createElement('button');remove.type='button';remove.className='button button-quiet';remove.textContent='Quitar foto';remove.setAttribute('aria-label',`Quitar fotografía ${number}`);
    const tools=document.createElement('div');tools.className='photo-actions';
    const rotators=[['izquierda',-1],['derecha',1]].map(([side,direction])=>{
      const button=document.createElement('button');
      button.type='button';button.className='button button-quiet';
      button.textContent=`Girar a la ${side}`;
      button.setAttribute('aria-label',`Girar fotografía ${number} a la ${side}`);
      button.addEventListener('click',()=>rotateEvidencePhoto(photo,direction));
      return button;
    });
    const message=document.createElement('span');message.className='field-help';message.id=`evidence-status-${number}`;message.setAttribute('role','status');upload.setAttribute('aria-describedby',message.id);
    Object.assign(photo,{card,upload,image,remove,rotators,message});
    tools.append(...rotators,remove);
    card.append(label,input,upload,image,tools,message);$('photo-slots').append(card);
    upload.addEventListener('click',()=>input.click());
    input.addEventListener('change',async()=>{
      const file=input.files[0];
      if (!file) return;
      input.value='';
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>20*1024*1024) {
        message.textContent='Seleccione una foto JPG, PNG o WebP de hasta 20 MB.';
        return;
      }
      const request=++photo.request;
      photo.loading=true;
      message.textContent='Preparando foto…';
      syncEvidence();update();
      try {
        const data=await readEvidencePhoto(file);
        if (photo.request!==request) return;
        photo.data=data;
        photo.original=data;
        photo.turns=0;
        message.textContent='Foto lista para el anexo.';
      } catch {
        if (photo.request!==request) return;
        message.textContent='No se pudo leer esta foto. Seleccione otra imagen.';
      }
      photo.loading=false;
      syncEvidence();update();
    });
    remove.addEventListener('click',()=>{
      photo.request++;
      photo.data='';photo.original='';photo.turns=0;photo.loading=false;message.textContent='Foto retirada.';
      syncEvidence();update();upload.focus();
    });
  });
  ['includeEvidence','evidenceCount'].forEach(id=>$(id).addEventListener('change',()=>{
    syncEvidence();update();
  }));

  // Searchable, single-choice SISOPE list. Free text is never a selected condition.
  let visible=[], activeIndex=-1;
  const combo=$('vulnerability'), listbox=$('vulnerability-list');
  function isOpen(){return !listbox.hidden;}
  function setActive(index) {
    const nodes=listbox.querySelectorAll('[role="option"]');
    activeIndex=index;
    nodes.forEach((node,i)=>node.classList.toggle('active',i===index));
    if (nodes[index]) {combo.setAttribute('aria-activedescendant',nodes[index].id);nodes[index].scrollIntoView({block:'nearest'});} else combo.removeAttribute('aria-activedescendant');
  }
  function openOptions(query='') {
    const words=normalize(query).trim().split(/\s+/).filter(Boolean);
    visible=catalogue.filter(item=>words.every(word=>normalize([item.category,item.group,item.label].join(' ')).includes(word)));
    listbox.replaceChildren();let previous='';
    visible.forEach(item=>{
      const groupLabel=[item.category,item.group].filter(Boolean).join(' / ');
      if(previous!==groupLabel){const header=document.createElement('div');header.className='combo-group';header.setAttribute('role','presentation');header.textContent=groupLabel;listbox.append(header);previous=groupLabel;}
      const option=document.createElement('div');option.id='sisope-'+item.id;option.className='combo-option';option.setAttribute('role','option');option.setAttribute('aria-selected',String(selected?.id===item.id));option.textContent=item.label;
      option.addEventListener('mousedown',event=>event.preventDefault());option.addEventListener('click',()=>choose(item));listbox.append(option);
    });
    if(!visible.length){const empty=document.createElement('div');empty.className='no-results';empty.textContent='No se encontraron vulnerabilidades. Pruebe otra palabra del listado.';listbox.append(empty);}
    listbox.hidden=false;combo.setAttribute('aria-expanded','true');setActive(-1);
  }
  function closeOptions(){listbox.hidden=true;combo.setAttribute('aria-expanded','false');combo.removeAttribute('aria-activedescendant');activeIndex=-1;}
  function choose(item){selected=item;combo.value=item.label;closeOptions();showMeta();touched.add('vulnerability');update();combo.focus();}
  combo.addEventListener('focus',()=>openOptions(selected ? '' : combo.value));
  combo.addEventListener('click',()=>{if(!isOpen())openOptions(selected?'':combo.value);});
  combo.addEventListener('input',()=>{selected=null;showMeta();openOptions(combo.value);update();});
  combo.addEventListener('blur',()=>{touched.add('vulnerability');showErrors(attempted);});
  combo.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='ArrowUp') {event.preventDefault();if(!isOpen())openOptions(selected?'':combo.value);setActive(event.key==='ArrowDown'?Math.min(activeIndex+1,visible.length-1):Math.max(activeIndex-1,0));}
    if(event.key==='Enter'){event.preventDefault();if(isOpen()&&visible[activeIndex])choose(visible[activeIndex]);else if(!isOpen())openOptions(selected?'':combo.value);}
    if(event.key==='Escape')closeOptions();
    if(event.key==='Tab')closeOptions();
  });
  $('combo-toggle').addEventListener('mousedown',event=>event.preventDefault());
  $('combo-toggle').addEventListener('click',()=>{if(isOpen())closeOptions();else{combo.focus();openOptions(selected?'':combo.value);}});
  document.addEventListener('click',event=>{if(!event.target.closest('.combo-wrap'))closeOptions();});

  // Calendars display and write dates exclusively as dd/mm/yyyy.
  const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  months.forEach((name,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=name;$('calendar-month').append(option);});
  let calendarField=null, calendarMonth=0, calendarYear=0;
  function renderCalendar(focusDay) {
    $('calendar-month').value=String(calendarMonth);$('calendar-year').value=String(calendarYear);
    const days=$('calendar-days');days.replaceChildren();
    const first=(makeDate(calendarYear,calendarMonth,1).getDay()+6)%7;
    for(let i=0;i<first;i++){const blank=document.createElement('span');blank.setAttribute('aria-hidden','true');days.append(blank);}
    const total=makeDate(calendarYear,calendarMonth+1,0).getDate(), today=formatDate(new Date()), chosen=calendarField?$(calendarField).value:'';
    for(let day=1;day<=total;day++){
      const date=makeDate(calendarYear,calendarMonth,day), formatted=formatDate(date), button=document.createElement('button');button.type='button';button.textContent=String(day);button.setAttribute('aria-label',formatted);button.dataset.day=String(day);
      if(formatted===today)button.classList.add('today');if(formatted===chosen){button.classList.add('selected');button.setAttribute('aria-current','date');}
      button.addEventListener('click',()=>pickDate(date));days.append(button);
    }
    if(focusDay)days.querySelector(`[data-day="${Math.min(total,focusDay)}"]`)?.focus();
  }
  function positionCalendar(){
    if($('calendar').hidden||!calendarField)return;
    const rect=$(calendarField).getBoundingClientRect(), cal=$('calendar'), width=cal.offsetWidth;
    const left=Math.max(14,Math.min(rect.left,window.innerWidth-width-14));
    cal.style.left=String(left+window.scrollX)+'px';cal.style.top=String(rect.bottom+window.scrollY+6)+'px';
  }
  function openCalendar(id){
    closeOptions();calendarField=id;const date=parseDate($(id).value)||new Date();calendarMonth=date.getMonth();calendarYear=date.getFullYear();
    $('calendar').hidden=false;document.querySelectorAll('.calendar-trigger').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.date===id)));renderCalendar();positionCalendar();
    const day=$('calendar-days').querySelector(`[data-day="${date.getDate()}"]`);day?.focus({preventScroll:true});
    $('calendar').scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function closeCalendar(focus=true){const id=calendarField;$('calendar').hidden=true;document.querySelectorAll('.calendar-trigger').forEach(b=>b.setAttribute('aria-expanded','false'));calendarField=null;if(focus&&id)$(id).focus({preventScroll:true});}
  function pickDate(date){if(!calendarField)return;const id=calendarField;$(id).value=formatDate(date);touched.add(id);closeCalendar();update();}
  function shiftMonth(delta,focusDay){const next=makeDate(calendarYear,calendarMonth+delta,1);if(next.getFullYear()<1||next.getFullYear()>9999)return;calendarYear=next.getFullYear();calendarMonth=next.getMonth();renderCalendar(focusDay);}
  document.querySelectorAll('.calendar-trigger').forEach(button=>button.addEventListener('click',()=>{if(calendarField===button.dataset.date)closeCalendar();else openCalendar(button.dataset.date);}));
  $('previous-month').addEventListener('click',()=>shiftMonth(-1));$('next-month').addEventListener('click',()=>shiftMonth(1));
  $('calendar-month').addEventListener('change',()=>{calendarMonth=Number($('calendar-month').value);renderCalendar();});
  $('calendar-year').addEventListener('change',()=>{const year=Number($('calendar-year').value);if(Number.isInteger(year)&&year>=1&&year<=9999)calendarYear=year;renderCalendar();});
  $('calendar-today').addEventListener('click',()=>pickDate(new Date()));$('calendar-close').addEventListener('click',()=>closeCalendar());
  $('calendar').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeCalendar();return;}
    const day=Number(event.target.dataset.day);if(!day)return;
    const deltas={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
    if(deltas[event.key]){event.preventDefault();const next=makeDate(calendarYear,calendarMonth,day+deltas[event.key]);if(next.getFullYear()<1||next.getFullYear()>9999)return;calendarYear=next.getFullYear();calendarMonth=next.getMonth();renderCalendar(next.getDate());}
  });
  document.addEventListener('click',event=>{if(!$('calendar').hidden&&!event.target.closest('#calendar')&&!event.target.closest('.calendar-trigger'))closeCalendar(false);});
  document.addEventListener('focusin',event=>{if(!$('calendar').hidden&&!event.target.closest('#calendar')&&!event.target.closest('.calendar-trigger'))closeCalendar(false);});
  window.addEventListener('resize',positionCalendar);

  function validateAction(){
    attempted=true;closeOptions();closeCalendar(false);const issues=showErrors(true);
    if(Object.keys(issues).length){status('Faltan datos o hay campos por corregir. Revisa el formulario.','error');$('validation-summary').scrollIntoView({behavior:'smooth',block:'center'});$('validation-summary').focus({preventScroll:true});return false;}
    return true;
  }
  function plainReport(){return Array.from($('report-document').children).filter(node=>node.tagName!=='HR').map(p=>p.classList.contains('report-meta') ? p.querySelector('.meta-label').innerText+' '+p.querySelector('.meta-value').innerText : p.innerText).join('\n\n');}
  function richReport(){
    const copy=$('report-document').cloneNode(true);copy.removeAttribute('id');copy.removeAttribute('class');copy.removeAttribute('aria-label');
    copy.setAttribute('style','font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.5;color:#000;text-align:justify;');
    // A borderless table preserves the aligned columns when pasted into Word.
    const metaRows=Array.from(copy.querySelectorAll('.report-meta'));
    if(metaRows.length){
      const table=document.createElement('table');table.setAttribute('style','width:100%;table-layout:fixed;border-collapse:collapse;border:0;margin:0 0 12pt;font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.5;');
      const columns=document.createElement('colgroup'),labelColumn=document.createElement('col'),valueColumn=document.createElement('col');labelColumn.setAttribute('style','width:34.4mm;');columns.append(labelColumn,valueColumn);table.append(columns);
      const body=document.createElement('tbody');table.append(body);metaRows[0].before(table);
      metaRows.forEach(row=>{
        const tr=document.createElement('tr'),label=document.createElement('td'),value=document.createElement('td');
        label.setAttribute('style','border:0;vertical-align:top;text-align:left;padding:0 4.7mm 10.5pt 0;');value.setAttribute('style','border:0;vertical-align:top;text-align:left;padding:0 0 10.5pt;');
        label.append(row.querySelector('.meta-label').cloneNode(true));Array.from(row.querySelector('.meta-value').childNodes).forEach(node=>value.append(node.cloneNode(true)));tr.append(label,value);body.append(tr);row.remove();
      });
      table.querySelectorAll('[class]').forEach(node=>node.removeAttribute('class'));
    }
    copy.querySelectorAll('p').forEach(p=>{p.setAttribute('style','margin:0 0 12pt;text-align:justify;'+(p.classList.contains('report-number')?'text-align:center;font-size:12pt;':'')+(p.classList.contains('report-letterhead')?'text-align:center;font-size:8pt;line-height:1.25;color:#777;':'')+(p.classList.contains('report-signoff')||p.classList.contains('report-recommendations')||p.classList.contains('report-recipient')||p.classList.contains('report-reference')?'text-align:left;':'')+(p.classList.contains('report-facts')?'white-space:pre-wrap;':''));p.removeAttribute('class');});
    copy.querySelectorAll('hr').forEach(hr=>{hr.setAttribute('style','border:0;border-top:1px solid #444;margin:0 0 12pt;');hr.removeAttribute('class');});
    copy.querySelectorAll('.report-signature').forEach(image=>{image.setAttribute('style','display:block;max-width:220px;max-height:90px;object-fit:contain;margin:0 0 6pt;');image.removeAttribute('class');});
    copy.querySelectorAll('.report-annex').forEach(annex=>{
      annex.setAttribute('style','page-break-before:always;text-align:center;');
      annex.querySelector('h3').setAttribute('style','font-size:12pt;text-align:center;margin:0 0 12pt;');
      annex.querySelectorAll('figure').forEach(figure=>figure.setAttribute('style','page-break-inside:avoid;text-align:center;margin:0 0 12pt;'));
      annex.querySelectorAll('img').forEach(image=>image.setAttribute('style','display:block;max-width:160mm;max-height:94mm;object-fit:contain;margin:0 auto 4pt;'));
      annex.querySelectorAll('figcaption').forEach(caption=>caption.setAttribute('style','font-size:10pt;text-align:center;'));
    });
    return '<!doctype html><html><head><meta charset="utf-8"></head><body>'+copy.outerHTML+'</body></html>';
  }
  function fallbackCopy(text){
    const previous=document.activeElement, area=document.createElement('textarea');area.className='copy-fallback';area.value=text;area.setAttribute('readonly','');document.body.append(area);area.focus();area.select();area.setSelectionRange(0,text.length);let ok=false;
    try{ok=document.execCommand('copy');}catch{}area.remove();previous?.focus({preventScroll:true});return ok;
  }
  $('copy-button').addEventListener('click',async()=>{
    if(!validateAction())return;
    const plain=plainReport();let copied=false,rich=false;
    try{if(navigator.clipboard?.write&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([plain],{type:'text/plain'}),'text/html':new Blob([richReport()],{type:'text/html'})})]);copied=true;rich=true;}}catch{}
    if(!copied){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(plain);copied=true;}}catch{}}
    if(!copied)copied=fallbackCopy(plain);
    if (!copied) status('No se pudo copiar automáticamente. Selecciona el texto del informe y cópialo manualmente.','error');
    else if (!rich && evidenceCount()) status('Texto copiado. Para incluir las fotos, imprime el informe o guárdalo como PDF.','success');
    else status('Informe copiado. Ya puedes pegarlo en Word.','success');
  });
  $('print-button').addEventListener('click',()=>{
    if (!validateAction()) return;
    try {
      preparePrintDocument();
      status('Informe listo. Si el diálogo de impresión no se abre, use Descargar PDF.');
      window.print();
    } catch {
      document.title=baseDocumentTitle;
      status('No se pudo abrir la impresión. Use Descargar PDF para guardar el informe.','error');
    }
  });
  $('pdf-button').addEventListener('click',async()=>{
    if (!validateAction()) return;
    $('pdf-button').disabled=true;
    status('Preparando el PDF…');
    try {
      const filename=pdfFilename();
      preparePrintDocument();
      await window.P65PDF.download($('print-pages'),filename);
      status('PDF descargado. Ábralo para imprimir.','success');
    } catch {
      status('No se pudo generar el PDF. Intente descargarlo nuevamente.','error');
    } finally {
      document.title=baseDocumentTitle;
      $('pdf-button').disabled=false;
    }
  });
  $('clear-button').addEventListener('click',()=>{
    const hasData=selected||signatureData||fields.some(id=>$(id).value)||combo.value||includesEvidence()||photoSlots.some(photo=>photo.data);
    if(hasData&&!window.confirm('¿Limpiar todos los datos de la visita y el informe?'))return;
    $('visit-form').reset();$('print-pages').replaceChildren();clearSignature();$('signature-status').textContent='';selected=null;attempted=false;touched.clear();closeOptions();closeCalendar(false);
    photoSlots.forEach(photo=>{photo.request++;photo.data='';photo.original='';photo.turns=0;photo.loading=false;photo.message.textContent='';});
    syncEvidence();showMeta();showErrors();renderReport();
    try{sessionStorage.removeItem(storageKey);}catch{}
    status('Formulario limpio. Puedes registrar una nueva visita.');$('reportNumber').focus();
  });
  $('visit-form').addEventListener('submit',event=>event.preventDefault());
  restore();syncSignature();syncEvidence();showMeta();renderReport();
})();
