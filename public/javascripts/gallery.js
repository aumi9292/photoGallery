/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
// take 3 refactored

class Slideshow {
  constructor(photos, photoIdx) {
    this.templates = this.generateTemplates();
    this.photos = photos;
    this.photoIdx = photoIdx;
  }

  init() {
    this.displayFirstSlide();
    this.bind();
    this.bindLikesAndFavorites();
    this.bindForm();
  }

  bind() {
    let previous = document.querySelector(".prev");
    let next = document.querySelector(".next");

    previous.addEventListener("click", e => {
      e.preventDefault();
      this.renderSlide({previous: true});
    });

    next.addEventListener("click", e => {
      e.preventDefault();
      this.renderSlide({previous: false});
    });
  }

  bindForm() {
    let postCommentForm = document.querySelector("form");
    console.log(postCommentForm);

    postCommentForm.addEventListener("submit", e => {
      e.preventDefault();
      let serialized = this.serializeData(postCommentForm);

      fetch("/comments/new", this.commentPostOptions(serialized))
        .then(response => response.json())
        .then(_ => {
          this.getCommentsFor(this.photoIdx);
          postCommentForm.reset();
        });
    });
  }

  updateTotal(total, response, btn) {
    let newTotal = `${response["total"]}`;
    total.innerHTML = newTotal;
    let selected = this.photos.find(photo => {
      return photo["id"] === this.photoIdx;
    });
    selected[btn] = newTotal;
  }

  postOptions() {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({photo_id: this.photoIdx}),
    };
  }

  fetchAndUpdate(total, buttonName) {
    fetch(`photos/${buttonName}`, this.postOptions())
      .then(response => response.json())
      .then(response => {
        this.updateTotal(total, response, `${buttonName}s`);
      });
  }

  bindLikesAndFavorites() {
    let likesBtn = document.querySelector("[data-property='likes'");

    let favoritesBtn = document.querySelector("[data-property='favorites'");

    likesBtn.addEventListener("click", e => {
      e.preventDefault();

      let total = likesBtn.querySelector("#total-likes");
      this.fetchAndUpdate(total, "like");
    });

    favoritesBtn.addEventListener("click", e => {
      e.preventDefault();

      let total = favoritesBtn.querySelector("#total-favorites");
      this.fetchAndUpdate(total, 'favorite');
    });
  }

  generateTemplates() {
    let templates = {};

    document.querySelectorAll('script[type="text/x-handlebars"]').forEach(temp => {
      templates[temp["id"]] = Handlebars.compile(temp.innerHTML);
    });

    document.querySelectorAll('[data-type=partial]').forEach(temp => {
      Handlebars.registerPartial(`${temp.id}`, temp.innerHTML);
    });
    return templates;
  }

  renderPhotos() {
    let slides = document.querySelector("#slides");
    slides.insertAdjacentHTML("afterbegin", this.templates.photos({photos: this.photos}));
  }

  renderPhotoInfo(id) {
    let infoHeader = document.querySelector("section > header");
    let selected = this.photos.find(photo => photo["id"] === id);
    let infoForPhoto = this.templates["photo_information"](selected);
    infoHeader.innerHTML = infoForPhoto;
  }

  getCommentsFor(id) {
    let commentsList = document.querySelector("#comments ul");
    fetch(`/comments?photo_id=${id}`)
      .then(response => response.json())
      .then(comments => {
        let templatedComments = this.templates["photo_comments"]({comments: comments});
        commentsList.innerHTML = templatedComments;
      });
  }

  getMinAndMaxIds() {
    let ids = this.photos.map(photo => Number(photo["id"]));
    ids.sort((a, b) => a - b);
    return [ids[0], ids[ids.length - 1]];
  }

  fadeoutCurrentPhoto() {
    document.querySelector(`[data-id='${this.photoIdx}']`).className = "fade";
  }

  getPreviousId() {
    let idx = this.photoIdx;
    let [minId, maxId] = this.getMinAndMaxIds();
    this.photoIdx = idx === minId ? maxId : idx - 1;
  }

  getNextId() {
    let idx = this.photoIdx;
    let [minId, maxId] = this.getMinAndMaxIds();
    this.photoIdx = idx === maxId ? minId : idx + 1;
  }

  showNextPhoto() {
    document.querySelector(`[data-id='${this.photoIdx}']`).className = "fadeIn";
  }

  renderSlide({previous}) {
    this.fadeoutCurrentPhoto();
    previous ? this.getPreviousId() : this.getNextId();
    this.renderPhotoInfo(this.photoIdx);
    this.bindLikesAndFavorites();
    this.getCommentsFor(this.photoIdx);
    this.showNextPhoto();
  }

  displayFirstSlide() {
    this.renderPhotos();
    this.renderPhotoInfo(this.photoIdx);
    this.getCommentsFor(this.photoIdx);
  }
  formatCommentPostRequest(form) {
    return {
      photo_id: this.photoIdx,
      name: form.querySelector("#name").value,
      email: form.querySelector("#email").value,
      body: form.querySelector("#body").value,
    };
  }
  serializeData(form) {
    let data = this.formatCommentPostRequest(form);
    let pairs = Object.entries(data);
    return pairs.map(([k, v]) => {
      return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    }).join('&');
  }

  commentPostOptions(serialized) {
    return {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: serialized,
    };
  }
}

document.addEventListener("DOMContentLoaded", e => {
  let slideshow;
  fetch("/photos")
    .then(response => response.json())
    .then(photos => {
      let photoIdx = Number(photos[0].id);
      slideshow = new Slideshow(photos, photoIdx);
      slideshow.init();
    });
});

// Plan for comments
// save reference to postCommentForm
// Register a "submit" event listener
//   Init an object with properties: name, email, body, save references from user input form data as property values
//    Serialize data from this object (iterate over object, call encodeURIComponent on all prop names and values, join all prop and prop values with =, join all different pairs with & )

//   init a post request to "comments/new" api endpoint (use fetch)
//   use the options object to set the http method to post and set the body to the encoded query string

//  after the post request updates the comments associated with the current photo, call getCommentsFor(photoIdx) to rerender the comments


// TAKE 2
// document.addEventListener("DOMContentLoaded", e => {

//   let photos;
//   let templates = {};
//   let photoIdx;

//   document.querySelectorAll('script[type="text/x-handlebars"]').forEach(temp => {
//     templates[temp["id"]] = Handlebars.compile(temp.innerHTML);
//   });

//   document.querySelectorAll('[data-type=partial]').forEach(temp => {
//     Handlebars.registerPartial(`${temp.id}`, temp.innerHTML);
//   });

//   fetch("/photos")
//     .then(response => response.json())
//     .then(json => {
//       photos = json;
//       renderPhotos();
//       photoIdx = Number(photos[0].id);
//       renderPhotoInfo(photoIdx);
//       getCommentsFor(photoIdx);
//     });


//   function renderPhotos() {
//     let slides = document.querySelector("#slides");
//     slides.insertAdjacentHTML("afterbegin", templates.photos({photos: photos}));
//   }

//   function renderPhotoInfo(id) {
//     let infoHeader = document.querySelector("section > header");
//     let selected = photos.find(photo => photo["id"] === id);
//     let infoForPhoto = templates["photo_information"](selected);
//     infoHeader.innerHTML = infoForPhoto;
//   }

//   function getCommentsFor(id) {
//     let commentsList = document.querySelector("#comments ul");
//     fetch(`/comments?photo_id=${id}`)
//       .then(response => response.json())
//       .then(comments => {
//         let templatedComments = templates["photo_comments"]({comments: comments});
//         commentsList.innerHTML = templatedComments;
//       });
//   }

//   function getMinAndMaxIds() {
//     let ids = photos.map(photo => Number(photo["id"]));
//     ids.sort((a, b) => a - b);
//     return [ids[0], ids[ids.length - 1]];
//   }

//   function fadeoutCurrentPhoto() {
//     document.querySelector(`[data-id='${photoIdx}']`).className = "fade";
//   }

//   function getPreviousId() {
//     let [minId, maxId] = getMinAndMaxIds();
//     photoIdx = photoIdx === minId ? maxId : photoIdx - 1;
//   }

//   function getNextId() {
//     let [minId, maxId] = getMinAndMaxIds();
//     photoIdx = photoIdx === maxId ? minId : photoIdx + 1;
//   }

//   function showNextPhoto() {
//     document.querySelector(`[data-id='${photoIdx}']`).className = "fadeIn";
//   }

//   function renderSlide(directionCallback) {
//     fadeoutCurrentPhoto();
//     directionCallback();
//     renderPhotoInfo(photoIdx);
//     getCommentsFor(photoIdx);
//     showNextPhoto();
//   }

//   let previous = document.querySelector(".prev");
//   let next = document.querySelector(".next");

//   previous.addEventListener("click", e => {
//     e.preventDefault();
//     renderSlide(getPreviousId);
//   });

//   next.addEventListener("click", e => {
//     e.preventDefault();
//     renderSlide(getNextId);
//   });

// });


// document.addEventListener("DOMContentLoaded", e => {

//   let slideshow = document.querySelector("#slideshow");
//   let photoTemplateText = document.querySelector("#photos").textContent;
//   let photoTemplator = Handlebars.compile(photoTemplateText);

//   let infoTemplateText = document.querySelector("#photo_information").textContent;
//   let infoTemplator = Handlebars.compile(infoTemplateText);

//   let commentsHeader = document.querySelector("#comments h3");

//   let commentTemplateText = document.querySelector("#photo_comments").textContent;
//   let commentTemplator = Handlebars.compile(commentTemplateText);

//   let partialCommentTemplateText = document.querySelector("#photo_comment").textContent;

//   Handlebars.registerPartial("photo_comment", partialCommentTemplateText);

//   let request = new XMLHttpRequest();
//   request.open("GET", '/photos');
//   request.responseType = "json";

//   request.addEventListener("load", e => {
//     let photos = e.currentTarget.response;
//     let currentPhoto = photos[0];
//     let photoId = currentPhoto.id;

//     let slides = document.createElement("DIV");
//     slides.id = "slides";
//     let infoHeader = document.querySelector("section");
//     let infoForPhoto = infoTemplator(currentPhoto);
//     let header = document.createElement("HEADER");
//     header.innerHTML = (infoForPhoto);
//     infoHeader.insertBefore(header, infoHeader.firstElementChild);

//     let templated = photoTemplator({photos: photos});
//     slides.innerHTML = templated;
//     slideshow.insertBefore(slides, slideshow.firstElementChild);

//     let commentsRequest = new XMLHttpRequest();
//     commentsRequest.open("GET", `/comments?photo_id=${photoId}`);
//     commentsRequest.responseType = "json";

//     commentsRequest.addEventListener("load", e => {
//       let comments = e.currentTarget.response;
//       let templatedComments = commentTemplator({comments: comments});
//       let commentsEl = document.createElement("UL");
//       commentsEl.innerHTML = templatedComments;
//       commentsHeader.insertAdjacentElement("afterend", commentsEl);
//     });

//     commentsRequest.send();
//   });
//   request.send();



//// });