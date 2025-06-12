const movies = [
{
  image: "img/joker.jpg",
  title: "小丑",
  rating: 4.5,
  synopsis:
  "失败的喜剧演员阿瑟·弗莱克（Arthur Fleck）走在高谭市的街道上，永远孤独地在人群中寻找联系。亚瑟戴着两个面具——一个是他为日常的小丑工作而画的面具，另一个是他徒劳的伪装，试图让自己感觉自己是周围世界的一部分。被社会孤立、欺负和漠视的弗莱克开始慢慢堕落到疯狂，因为他变成了一个被称为小丑的犯罪策划者。" },

{
  image: "img/godzilla-king-of-the-monsters.jpg",
  title: "Godzilla: King of the Monsters",
  rating: 3.5,
  synopsis:
  "Members of the crypto-zoological agency Monarch face off against a battery of god-sized monsters, including the mighty Godzilla, who collides with Mothra, Rodan, and his ultimate nemesis, the three-headed King Ghidorah. When these ancient super-species-thought to be mere myths-rise again, they all vie for supremacy, leaving humanity's very existence hanging in the balance." },

{
  image: "img/abominable.jpg",
  title: "Abominable",
  rating: 4.6,
  synopsis:
  "After discovering a Yeti on the roof of her apartment building, teenage Yi and her two friends embark on an epic quest to reunite the magical creature with his family. But to do so, they must stay one step ahead of a wealthy financier and a determined zoologist who want to capture the beast for their own gain." },

{
  image: "img/scary-movie.jpg",
  title: "Scary Movie",
  rating: 3.8,
  synopsis:
  'Defying the very notion of good taste, Scary Movie out-parodies the pop culture parodies with a no-holds barred assault on the most popular images and talked-about moments from recent films, television and commercials. The film boldly fires barbs at the classic scenes from "Scream," "The Sixth Sense," "The Matrix," "I Know What You Did Last Summer" and "The Blair Witch Project," then goes on to mock a whole myriad of teen movie clichés, no matter the genre.' },
{
  image: "img/casino-royale.jpg",
  title: "Casino Royale",
  rating: 4.7,
  synopsis:
  'After receiving a license to kill, British Secret Service agent James Bond (Daniel Craig) heads to Madagascar, where he uncovers a link to Le Chiffre (Mads Mikkelsen), a man who finances terrorist organizations. Learning that Le Chiffre plans to raise money in a high-stakes poker game, MI6 sends Bond to play against him, gambling that their newest "00" operative will topple the man\'s organization.' },

{
  image: "img/jurassic-park.jpg",
  title: "Jurassic Park",
  rating: 4.8,
  synopsis:
  "In Steven Spielberg's massive blockbuster, paleontologists Alan Grant (Sam Neill) and Ellie Sattler (Laura Dern) and mathematician Ian Malcolm (Jeff Goldblum) are among a select group chosen to tour an island theme park populated by dinosaurs created from prehistoric DNA. While the park's mastermind, billionaire John Hammond (Richard Attenborough), assures everyone that the facility is safe, they find out otherwise when various ferocious predators break free and go on the hunt." }];



const sliderList = document.querySelector(".slider__list");
const title = document.querySelector(".text__title");
const starList = document.querySelector(".text__rating-star-list");
const ratingNum = document.querySelector(".text__rating-number");
const synopsis = document.querySelector(".text__synopsis");

let step = 0;

const composeChild = (c, i) => addChild(createChild(c, i));

const addChild = c => sliderList.appendChild(c);

const createChild = (movie, p) => {
  if (p === 0) renderText(movie);

  const c = document.createElement("li");
  c.classList.add("slider__item");
  c.style.transform = `translateX(${p === 0 ? 45.5 : 45.5 + 17.3 * p}rem)`;

  const img = document.createElement("img");
  img.classList.add("slider__item-img");
  img.src = movie.image;

  c.appendChild(img);

  return c;
};

const updateChild = (c, i) => {
  const p = (i + movies.length - 1) % movies.length;
  c.style.transform = `translateX(${45.5 + 17.3 * p}rem)`;
};

const renderStars = (stars, movie) => {
  const pct = movie.rating * 10;

  Array.from(Array(stars).keys()).forEach(i => {
    const c = document.createElement("li");
    c.classList.add("text__rating-star");

    const div = document.createElement("div");
    div.classList.add("text__rating-star-fill");
    div.style.width = (i === stars - 1 && stars !== movie.rating ? pct : 100) + '%'; // prettier-ignore

    c.append(div);

    starList.appendChild(c);
  });
};

const renderText = movie => {
  const stars = Math.ceil(movie.rating);

  title.textContent = movie.title;
  ratingNum.textContent = `${movie.rating} / 5`;
  synopsis.textContent = movie.synopsis;
  starList.innerHTML = "";
  renderStars(stars, movie);
};

const rotate = () => {
  const currentMovie = movies[step];
  const nextMovie = movies[(step + 1) % movies.length];
  const newChild = createChild(currentMovie, movies.length - 1);
  step = (step + 1) % movies.length;

  Array.from(sliderList.children).forEach(updateChild);
  sliderList.removeChild(sliderList.childNodes[0]);
  sliderList.appendChild(newChild);
  renderText(nextMovie);
};

const initSlides = () => movies.forEach(composeChild);

initSlides();