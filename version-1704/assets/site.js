(function(){
  var menu=document.getElementById('menuBtn');
  var panel=document.getElementById('mobileMenu');
  if(menu&&panel){menu.addEventListener('click',function(){panel.classList.toggle('open')})}
  var slides=[].slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots=[].slice.call(document.querySelectorAll('[data-hero-dot]'));
  var current=0;
  function showHero(i){
    if(!slides.length)return;
    current=(i+slides.length)%slides.length;
    slides.forEach(function(s,k){s.classList.toggle('active',k===current)});
    dots.forEach(function(d,k){d.classList.toggle('active',k===current)});
  }
  dots.forEach(function(d,i){d.addEventListener('click',function(){showHero(i)})});
  if(slides.length>1){setInterval(function(){showHero(current+1)},5200)}
  var input=document.querySelector('[data-filter-input]');
  var year=document.querySelector('[data-filter-year]');
  var genre=document.querySelector('[data-filter-genre]');
  var category=document.querySelector('[data-filter-category]');
  var cards=[].slice.call(document.querySelectorAll('.movie-card'));
  var empty=document.querySelector('[data-empty]');
  function filterCards(){
    if(!cards.length)return;
    var q=(input&&input.value||'').trim().toLowerCase();
    var y=year&&year.value||'';
    var g=genre&&genre.value||'';
    var c=category&&category.value||'';
    var visible=0;
    cards.forEach(function(card){
      var ok=true;
      var search=(card.getAttribute('data-search')||'').toLowerCase();
      if(q&&search.indexOf(q)===-1)ok=false;
      if(y&&card.getAttribute('data-year')!==y)ok=false;
      if(g&&(card.getAttribute('data-genre')||'').indexOf(g)===-1)ok=false;
      if(c&&card.getAttribute('data-category')!==c)ok=false;
      card.classList.toggle('hide-card',!ok);
      if(ok)visible++;
    });
    if(empty)empty.style.display=visible?'none':'block';
  }
  [input,year,genre,category].forEach(function(el){if(el){el.addEventListener('input',filterCards);el.addEventListener('change',filterCards)}});
})();