(() => {
  'use strict';

  function element(tag, className = '', text = '') {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function header(doc, {number, reference, subject, date}) {
    const letterhead = element('p', 'report-letterhead');
    window.P65Print.headerLines.forEach((line, index) => {
      if (index) letterhead.append(element('br'));
      letterhead.append(line);
    });
    const heading = element('p', 'report-number');
    heading.append(element('strong', '', 'INFORME N° ' + number));
    doc.append(letterhead, heading);

    function metadata(label, text, className) {
      const row = element('p', 'report-meta ' + className);
      const value = element('span', 'meta-value', text);
      row.append(element('strong', 'meta-label', label), value);
      doc.append(row);
      return value;
    }

    metadata('A:', '', 'report-recipient').append(
      element('strong', '', 'DAVID DANY GARCIA VENTOCILLA'),
      element('br'), 'Coordinador Territorial',
      element('br'), 'Unidad Territorial Junín'
    );
    metadata('REFERENCIA:', reference, 'report-reference');
    metadata('ASUNTO:', subject, 'report-subject');
    metadata('FECHA:', date, 'report-date');
    doc.append(element('hr', 'report-divider'));
  }

  function signoff(doc, promoter, signature) {
    const closing = element('p', 'report-signoff', 'Atentamente,');
    closing.append(element('br'), element('br'));
    if (signature) {
      const image = element('img', 'report-signature');
      image.src = signature;
      image.alt = 'Firma del promotor';
      closing.append(image);
    }
    closing.append('Promotor del Programa Pensión 65', element('br'), element('strong', '', promoter));
    doc.append(closing);
  }

  window.P65ReportFormat = Object.freeze({header, signoff});
})();
