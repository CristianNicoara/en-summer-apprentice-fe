import { useStyle } from "./src/components/styles";
import { kebabCase, addPurchase } from "./src/utils";

// Navigate to a specific URL
function navigateTo(url) {
  history.pushState(null, null, url);
  renderContent(url);
}
// HTML templates
function getHomePageTemplate() {
  return `
   <div id="content" >
      <img class = "home-img" src="./src/assets/background_TMS.png" alt="summer">
      <div class="events flex items-center justify-center flex-wrap page">
      </div>
    </div>
  `;
}

function getOrdersPageTemplate() {
  return `
    <div id="content">
      <h1 class="text-2xl mb-4 mt-8 text-center">Purchased Tickets</h1>
    </div>
  `;
}

function setupNavigationEvents() {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const href = link.getAttribute('href');
      navigateTo(href);
    });
  });
}

function setupMobileMenuEvent() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

function setupPopstateEvent() {
  window.addEventListener('popstate', () => {
    const currentUrl = window.location.pathname;
    renderContent(currentUrl);
  });
}

function setupInitialPage() {
  const initialUrl = window.location.pathname;
  renderContent(initialUrl);
}

function renderHomePage() {
  const mainContentDiv = document.querySelector('.main-content-component');
  mainContentDiv.innerHTML = getHomePageTemplate();
  fetchTicketEvents().then((data) => {
    console.log("data:", data);
    addEventsToPage(data);
  });
}

async function fetchTicketEvents(){
  const response = await fetch('https://localhost:7268/api/Event/GetEvents');
  const data  = await response.json();
  return data;
}

const addEventsToPage = (events) => {
  const eventsDiv = document.querySelector('.events');
  eventsDiv.innerHTML = 'No events';
  if (events.length) {
    eventsDiv.innerHTML = '';
    events.forEach(event => {
      eventsDiv.appendChild(createEvent(event));
    });
  }
};

const createEvent = (eventData) => {
  const title = kebabCase(eventData.type);
  const eventElement = createEventElement(eventData, title);
  return eventElement;
};

const createEventElement = (eventData, title) => {
  const ticketCategories = eventData.ticketCategories;
  const eventDiv = document.createElement('div');
  const eventWrapperClasses = useStyle('eventWrapper');
  const actionsWrapperClasses = useStyle('actionsWrapper');
  const quantityClasses = useStyle('quantity');
  const inputClasses = useStyle('input');
  const quantityActionsClasses = useStyle('quantityActions');
  const increaseBtnClasses = useStyle('increaseBtn');
  const decreaseBtnClasses = useStyle('decreaseBtn');
  const addToCartBtnClasses = useStyle('addToCartBtn');

  eventDiv.classList.add(...eventWrapperClasses);

  const contentMarkup = `
    <header>
      <h2 class = "event-title text-2xl font-bold">${eventData.eventName}</h2>
    </header>
    <div class="content">
      <img src = "./src/assets/${eventData.eventName}.jpg" alt="${eventData.eventName}" class = "event-image w-full height-200 rounded">
      <p class="description text-gray-700">${eventData.eventDescription}</p>
      <div class = "flex gap-3">
        <i class = "fas fa-map-marker-alt"></i>
        <p class="description text-gray-700">${eventData.venue.venueLocation}</p>
      </div>
      </div>
  `;
  eventDiv.innerHTML = contentMarkup;

  const actions = document.createElement('div');
  actions.classList.add(...actionsWrapperClasses);

  const categoriesOptions = ticketCategories.map(
    (ticketCategory) =>
      `<option value=${ticketCategory.ticketCategoryDescription}>${ticketCategory.ticketCategoryDescription}</option>`
  );

  const ticketTypeMarkup = `
    <h2 class = "text-lg font-bold mb-2">Choose Ticket Type:</h2>
    <select id="ticketType" name="ticketType" class="select ${title}-ticket-type border border-gray-300 rounded">
      ${categoriesOptions.join('\n')}
    </select>
  `;
  actions.innerHTML = ticketTypeMarkup;

  const quantity = document.createElement('div');
  quantity.classList.add(...quantityClasses);

  const input = document.createElement('input');
  input.classList.add(...inputClasses);
  input.type = 'number';
  input.min = '0';
  input.value = '0';

  input.addEventListener('blur', () => {
    if (!input.value) {
      input.value = 0;
    }
  });

  input.addEventListener('input', () => {
    const currentQuantity = parseInt(input.value);
    if (currentQuantity > 0) {
      addOrder.disabled = false;
    } else {
      addOrder.disabled = true;
    }
  });

  quantity.appendChild(input);

  const qunatityActions = document.createElement('div');
  qunatityActions.classList.add(...quantityActionsClasses);
  
  const increase = document.createElement('button');
  increase.classList.add(...increaseBtnClasses);
  increase.innerText = "+";
  increase.addEventListener('click', () => {
    input.value = parseInt(input.value) + 1;
    const currentQuantity = parseInt(input.value);
    if (currentQuantity > 0) {
      addOrder.disabled = false;
    } else {
      addOrder.disabled = true;
    }
  });

  const decrease = document.createElement('button');
  decrease.classList.add(...decreaseBtnClasses);
  decrease.innerText = "-";
  decrease.addEventListener('click', () => {
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
      input.value = parseInt(input.value) - 1;
    }
    const currentQuantity = parseInt(input.value);
    if (currentQuantity > 0) {
      addOrder.disabled = false;
    } else {
      addOrder.disabled = true;
    }
  });

  qunatityActions.appendChild(increase);
  qunatityActions.appendChild(decrease);

  quantity.appendChild(qunatityActions);
  actions.appendChild(quantity);
  eventDiv.appendChild(actions);

  const eventFooter = document.createElement('footer');
  const addOrder = document.createElement('button');
  addOrder.classList.add(...addToCartBtnClasses);
  addOrder.innerText = 'Add Order';
  addOrder.disabled = true;

  addOrder.addEventListener('click', () => {
    handleAddOrder(title,eventData.eventId,input,addOrder);
  });

  eventFooter.appendChild(addOrder);
  eventDiv.appendChild(eventFooter);

  return eventDiv;
};

const handleAddOrder = (title, id, input, addOrder) => {
  const ticketType = document.querySelector(`.${kebabCase(title)}-ticket-type`).value;
  const quantity = input.value;
  if (parseInt(quantity)){
    fetch('http://localhost:8080/orders/add',{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
    },
    body:JSON.stringify({
      eventId:id,
      ticketCategoryDescription:ticketType,
      numberOfTickets:quantity
    })
  }).then((response) => {
    return response.json().then((data) => {
      if (!response.ok){
        console.log("Something went wrong:(");
      }
      return data;
    }) 
  }).then((data) => {
    addPurchase(data);
    console.log("Done!:)");
    input.value=0;
    addOrder.disabled = true;
  })
  } else {

  }
}

function renderOrdersPage(categories) {
  const mainContentDiv = document.querySelector('.main-content-component');
  mainContentDiv.innerHTML = getOrdersPageTemplate();
}

// Render content based on URL
function renderContent(url) {
  const mainContentDiv = document.querySelector('.main-content-component');
  mainContentDiv.innerHTML = '';

  if (url === '/') {
    renderHomePage();
  } else if (url === '/orders') {
    renderOrdersPage()
  }
}

// Call the setup functions
setupNavigationEvents();
setupMobileMenuEvent();
setupPopstateEvent();
setupInitialPage();
