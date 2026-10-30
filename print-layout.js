'use strict';
(() => {
  const headerLines = [
    '"Decenio de la Igualdad de Oportunidades para Mujeres y Hombres"',
    '"Año de la Esperanza y el Fortalecimiento de la Democracia"'
  ];
  function build(source, valid) {
    const output=document.getElementById('print-pages');
    output.replaceChildren();
    const pages=[];
    let content;
    function newPage() {
      const page=document.createElement('section');page.className='print-page';
      const header=document.createElement('header');header.className='print-page-header';
      headerLines.forEach((line,i)=>{if(i)header.append(document.createElement('br'));header.append(document.createTextNode(line));});
      content=document.createElement('div');content.className='report-document print-page-body';
      const footer=document.createElement('footer');footer.className='print-page-footer';
      page.append(header,content,footer);output.append(page);pages.push(page);
    }
    function overflows() { return content.scrollHeight > content.clientHeight + 1; }
    // Ranges preserve the original text and emphasis when a long paragraph spans pages.
    function splitBlock(block, offset) {
      const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);
      let text=walker.nextNode(),remaining=offset;
      while(text && remaining>text.length){remaining-=text.length;text=walker.nextNode();}
      if(!text)return [block.cloneNode(true),block.cloneNode(false)];
      const before=document.createRange(),after=document.createRange();
      before.setStart(block,0);before.setEnd(text,remaining);
      after.setStart(text,remaining);after.setEnd(block,block.childNodes.length);
      const first=block.cloneNode(false),last=block.cloneNode(false);
      first.append(before.cloneContents());last.append(after.cloneContents());
      return [first,last];
    }
    function fitPrefix(block) {
      let low=0,high=block.textContent.length;
      while(low<high){
        const middle=Math.ceil((low+high)/2),test=splitBlock(block,middle)[0];
        content.append(test);const fits=!overflows();test.remove();
        if(fits)low=middle;else high=middle-1;
      }
      // Keep whole words when possible, without dropping spaces or line breaks.
      const text=block.textContent;
      if(low<text.length){
        const atSpace=/\s/.test(text[low]||'')||/\s/.test(text[low-1]||'');
        if(!atSpace){const boundary=text.slice(0,low).search(/\s+\S*$/);if(boundary>0)low=boundary+1;}
        if(low>0 && /[\uD800-\uDBFF]/.test(text[low-1]))low--;
      }
      return low;
    }
    function addBlock(original) {
      let block=original.cloneNode(true);
      const sourceImages=original.querySelectorAll('img');
      block.querySelectorAll('img').forEach((image,index)=>{
        const sourceImage=sourceImages[index];
        if(sourceImage?.naturalWidth && sourceImage?.naturalHeight){
          const scale=Math.min(55*96/25.4/sourceImage.naturalWidth,24*96/25.4/sourceImage.naturalHeight,1);
          image.style.width=(sourceImage.naturalWidth*scale)+'px';image.style.height=(sourceImage.naturalHeight*scale)+'px';
        }
      });
      while(block){
        content.append(block);
        if(!overflows())return;
        block.remove();
        // Keep signatures, headings and short paragraphs together where they fit.
        const keepTogether=block.classList.contains('report-signoff') || block.classList.contains('report-recipient') || block.classList.contains('report-number') || block.classList.contains('report-recommendations') || block.textContent.length<300;
        if(keepTogether && content.childNodes.length){newPage();continue;}
        const offset=fitPrefix(block);
        if(offset===0){
          if(content.childNodes.length){newPage();continue;}
          throw new Error('A report element does not fit on an A4 page.');
        }
        const [first,last]=splitBlock(block,offset);content.append(first);
        if(!last.textContent.length)return;
        newPage();block=last;
      }
    }
    newPage();
    if(!valid){const warning=document.createElement('p');warning.textContent='Complete y valide el formulario mediante IMPRIMIR INFORME antes de imprimir.';content.append(warning);}
    else {
      const blocks=Array.from(source.children).filter(node=>!node.classList.contains('report-letterhead'));
      blocks.forEach((block,index)=>{
        // A recommendation heading must have room for at least the first line below it.
        if(block.classList.contains('report-recommendations') && content.childNodes.length){
          const probe=block.cloneNode(true),line=document.createElement('p');line.textContent='Recomendación';content.append(probe,line);const needsPage=overflows();probe.remove();line.remove();if(needsPage)newPage();
        }
        // The rule belongs to the preceding date rather than a new page by itself.
        if(block.tagName==='HR' && content.childNodes.length){content.append(block.cloneNode(true));if(overflows()){content.lastChild.remove();const preceding=content.lastChild;preceding?.remove();newPage();if(preceding)addBlock(preceding);}else return;}
        addBlock(block);
      });
    }
    const count=pages.length;
    pages.forEach((page,index)=>{page.querySelector('.print-page-footer').textContent=`Página ${index+1} de ${count}`;page.setAttribute('aria-label',`Página ${index+1} de ${count}`);});
    return count;
  }
  window.P65Print=Object.freeze({headerLines:Object.freeze(headerLines),build});
})();
