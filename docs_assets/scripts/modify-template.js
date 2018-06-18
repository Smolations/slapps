const hiddenClasses = [
  'Configable',
  'Envable',
  'Identifyable',
  'Jsonable',
  'Logable',
  'Proxyable',
];

const checkForJquery = setInterval(() => {
  if (window.jQuery) {
    clearInterval(checkForJquery);
    modify();
  }
}, 100);


function modify() {
  const $classes = $('.lnb-api h3:contains("Classes")').parent();

  if (!$classes.length) {
    console.error(`couldn't find Classes header`);
  }

  hiddenClasses.forEach((name) => {
    const $anchor = $classes.find(`a:contains('${name}')`);
    if ($anchor.length) {
      $anchor.parent().hide();
    }
  });
}
