import { useStyle } from "./src/components/styles";
import { kebabCase, addPurchase } from "./src/utils";
import { createOrder } from "./src/components/createOrder";
import { addLoader, removeLoader } from "./src/components/loader";


function navigateTo(url) {
  history.pushState(null, null, url);
  renderContent(url);
}

function getHomePageTemplate() {
  return `
   <div id="content" >
      <img class = "home-img" src="./src/assets/background_TMS.png" alt="summer">
      <div class="filters page">
        <input type="text" id="filter-by-name" placeholder="Search by Name" class="px-4 mt-4 mb-4 py-2 boarded border-indigo-800 rounded"/>
        <div class = "px-4 mt-4 mb-4 py-2 flex-row-container">
          <div class = "flex-direction-column">
            <h2 class = "text-white text-lg font-bold mb-2">Choose the Location:</h2>
            <select id="eventLocation" name="eventLocation" class="select border border-indigo-800 rounded">
            </select>
          </div>
          <div class = "flex-direction-column">
            <h2 class = "text-white text-lg font-bold mb-2">Choose the Event Type:</h2>
            <select id="eventType" name="eventType" class="select border border-indigo-800 rounded">
            </select>
          </div>
        </div>
      </div>
      <div class="events flex items-center justify-center flex-wrap page">
      </div>
    </div>
  `;
}


function getOrdersPageTemplate() {
  return `
    <div id="content" class = "page">
      <h1 class="text-2xl text-center">Purchased Tickets</h1>
      <div class="orders">
        <div class="px-4 py-3 gap-x-4 flex font-bold text-white">
          <span class = "flex-1">Event</span>
          <span class = "flex-1">Nr tickets</span>
          <span class = "flex-1">Ticket Type</span>
          <span class = "flex-1 hidden md:flex">Ordered At</span>
          <span class = "flex-1">Price</span>
          <span class = "w-28 sm:w-8"></span>
        </div>
        <div id="orders-content">
        </div>
      </div>
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
  addLoader();
  fetchTicketEvents().then((data) => {
    setTimeout(() => {
      removeLoader()
    }, 500);
    setupFilters(data);
  });
}

function filterByName(events, filterInput) {
  const searchValue = filterInput.value;

  if (searchValue !== undefined) {
    const filteredEvents = events.filter((event) =>
      event.eventName.toLowerCase().includes(searchValue.toLowerCase())
    );
    addEventsToPage(filteredEvents);
  } else {
    addEventsToPage(events);
  }
}

async function setupFilters(events) {
  const nameFilterInput = document.querySelector('#filter-by-name');

  if (nameFilterInput) {
    const filterInterval = 200;
    nameFilterInput.addEventListener('keyup', () => {
      setTimeout(filterByName(events, nameFilterInput), filterInterval);
    })

    addEventsToPage(events);
  } else {
    addEventsToPage(events);
  }

  const eventLocationFilter = document.getElementById('eventLocation');
  const eventTypeFilter = document.getElementById('eventType');

  const venues = await fetchVenues();
  const eventTypes = await fetchEventTypes();

  const eventLocationOptions = venues.map(
    (venue) =>
      `<option class = "text-sm font-bold text-black" value=${venue.id}>${venue.location}</option>`
  ).join('\n');
  eventLocationOptions.concat('<option class = "text-sm font-bold text-black" value=0>None</option>');

  const eventTypeOptions = eventTypes.map(
    (eventType) =>
      `<option class = "text-sm font-bold text-black" value="${eventType.name}">${eventType.name}</option>`
  ).join('\n');

  eventLocationFilter.innerHTML = eventLocationOptions + '<option class = "text-sm font-bold text-black" value=0>None</option>';
  eventTypeFilter.innerHTML = eventTypeOptions + '<option class = "text-sm font-bold text-black" value="None">None</option>';

  eventLocationFilter.addEventListener("change", filterByLocationAndType);
  eventTypeFilter.addEventListener("change", filterByLocationAndType);

  async function filterByLocationAndType() {
    const venueId = eventLocationFilter.value;
    const eventTypeName = eventTypeFilter.value;
    const respone = await fetch(`http://localhost:8080/events?venueId=${venueId}&eventTypeName=${eventTypeName}`);
    const data = await respone.json();
    addEventsToPage(data);
  }
}

async function fetchVenues() {
  const response = await fetch('http://localhost:8080/venues');
  const data = await response.json();
  return data;
}

async function fetchEventTypes() {
  const respone = await fetch('http://localhost:8080/eventTypes');
  const data = await respone.json();
  return data;
}

async function fetchTicketEvents() {
  const response = await fetch('https://localhost:7268/api/Event/GetEvents');
  const data = await response.json();
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
  const title = kebabCase(eventData.eventName);
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
      `<option value=${ticketCategory.ticketCategoryId}>${ticketCategory.ticketCategoryDescription} $${ticketCategory.ticketCategoryPrice}</option>`
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

  const quantityActions = document.createElement('div');
  quantityActions.classList.add(...quantityActionsClasses);

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

  quantityActions.appendChild(increase);
  quantityActions.appendChild(decrease);

  quantity.appendChild(quantityActions);
  actions.appendChild(quantity);
  eventDiv.appendChild(actions);

  const eventFooter = document.createElement('footer');
  const addOrder = document.createElement('button');
  addOrder.classList.add(...addToCartBtnClasses);
  addOrder.innerText = 'Add Order';
  addOrder.disabled = true;

  addOrder.addEventListener('click', () => {
    handleAddOrder(title, eventData.eventId, input, addOrder);
  });

  eventFooter.appendChild(addOrder);
  eventDiv.appendChild(eventFooter);

  return eventDiv;
};

const handleAddOrder = (title, id, input, addOrder) => {
  const ticketType = document.querySelector(`.${kebabCase(title)}-ticket-type`).value;
  const quantity = input.value;
  if (parseInt(quantity)) {
    fetch('http://localhost:8080/orders/add', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: id,
        ticketCategoryId: ticketType,
        numberOfTickets: quantity
      }),
    })
      .then((response) => {
        return response.json()
          .then((data) => {
            if (!response.ok) {
              toastr.error("Order not possible!");
            } else {
              toastr.success("Success!")
            }
            return data;
          });
      })
      .then((data) => {
        addPurchase(data);
        input.value = 0;
        addOrder.disabled = true;
      })
  } else {

  }
}

function renderOrdersPage() {
  const mainContentDiv = document.querySelector('.main-content-component');
  mainContentDiv.innerHTML = getOrdersPageTemplate();
  addOrdersToPage();
}

async function fetchOrders() {
  const response = await fetch('http://localhost:8080/orders');
  const data = await response.json();
  return data;
}

const addOrdersToPage = async () => {
  const ordersDiv = document.querySelector('.orders');
  const ordersContent = document.getElementById('orders-content');
  if (ordersDiv) {
    addLoader();
    fetchOrders().then((orders) => {
      if (orders.length) {
        orders.forEach(async (order) => {
          const newOrder = await createOrder(order);
          ordersContent.appendChild(newOrder);
        });
        ordersDiv.appendChild(ordersContent);
      } else {

      }
    })
      .finally(() => {
        setTimeout(() => {
          removeLoader()
        }, 500);
      })
  }
};


function renderContent(url) {
  const mainContentDiv = document.querySelector('.main-content-component');
  mainContentDiv.innerHTML = '';

  if (url === '/') {
    renderHomePage();
  } else if (url === '/orders') {
    renderOrdersPage();
  }
}

// Call the setup functions
setupNavigationEvents();
setupMobileMenuEvent();
setupPopstateEvent();
setupInitialPage();