const checklist = `#### Страница Main (60)
1. Проверка верстки **+7**
   - [] верстка страницы валидная: для проверки валидности вёрстки используйте сервис https://validator.w3.org/ . **+4**  
   Валидной вёрстке соответствует надпись "Document checking completed. No errors or warnings to show." В таком случае баллы за пункт требований выставляем полностью. Если есть предупреждения - \`warnings\`, но нет ошибок - \`errors\`, выставляем половину баллов за пункт требований
   - [] логотип в хедере состоит из текстовых элементов **+1**
   - [] страница содержит ровно один элемент \`<h1>\` **+1**
   - [x] добавлен favicon **+1**
2. Вёрстка соответствует макету **+35**
   - [x] блок \`<header>\` **+5**
   - [x] блок \`Not only\` **+5**
   - [x] блок \`About\` **+5**
   - [] блок \`Our Friends\` **+5**
   - [x] блок \`Help\` **+5**
   - [x] блок \`In addition\` **+5**
   - [] блок \`<footer>\` **+5**  
3. Требования к css **+6**
   - [x] для позиционирования элементов блока Help использована сеточная верстка (flexbox или grid) **+2**
   - [x] при уменьшении масштаба страницы браузера или увеличении ширины страницы (>1280px) вёрстка размещается по центру, а не сдвигается в сторону и не растягивается по всей ширине **+2**
   - [x] фоновый цвет тянется на всю ширину страницы **+2**
4. Интерактивность элементов **+12**
   - [] элемент \`About the Shelter\` в навигации подсвечен и неинтерактивен, остальные элементы навигации интерактивны **+2**
   - [] каждая карточка с питомцем в блоке **Our Friends** интерактивна при наведении на любую область этой карточки **+2**
   - [] плавная прокрутка по якорям **+2**
   - [] выполняются все ссылочные связи согласно **Перечню ссылочных связей** для страницы \`Main\` **+2**
   - [] выполнена интерактивность ссылок и кнопок. Интерактивность заключается не только в изменении внешнего вида курсора, например, при помощи свойства \`cursor: pointer\`, но и в использовании и других визуальных эффектов, например, изменение цвета фона или цвета шрифта, согласно стайлгайду в макете. Если в макете стили не указаны, реализуете их по своему усмотрению, руководствуясь общим стилем макета **+2**
   - [] обязательное требование к интерактивности: плавное изменение внешнего вида элемента при наведении и клике, не влияющее на соседние элементы **+2**`;

const links = `## Перечень ссылочных связей
#### На странице Main
1. На страницу \`Pets\` ведут:
   - элемент навигации \`Our Pets\`
   - кнопка \`Get to know the rest\` в блоке **Our Friends**
2. На блок **Help** текущей страницы (якорная ссылка) ведут:
   - элемент навигации \`Help the shelter\`
3. На блок **Our Friends** текущей страницы (якорная ссылка) ведут:
   - кнопка \`Make a Friend\` в блоке **Not only**
4. На футер текущей страницы (якорная ссылка) ведут:
   - элемент навигации \`Contacts\`
5. Пустая ссылка:
   - логотип
   - номер банковской карты в блоке **In addition**
6. Другие варианты поведения:
   - в футере при нажатии на email или его иконку должен открываться почтовый сервис
   - в футере при нажатии на телефон или его иконку должен открываться набор номера
   - в футере при нажатии на локацию должна открываться страница с google maps в отдельном окне или вкладке браузера с любой локацией на ваш выбор`;

const [points, total] = checklist
  .split`\n`
  .map(line => line.match(/\[(x?)\].+\+(\d+)\*\*/))
  .filter(e => e)
  .reduce((acc, [, done, points]) => (acc[0] += done ? +points : 0, acc[1] += +points, acc), [0, 0]);

console.log(`\
${checklist}
---
${links}
---
**Total:** ${points}/${total}`
);