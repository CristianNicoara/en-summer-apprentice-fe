import { kebabCase } from "../utils";
import { useStyle } from "./styles";

export const createOrder = async (orderData) => {
    const order = document.createElement('div');
    order.id = `order-${orderData.orderId}`;
    order.classList.add(...useStyle('purchase'));
  
    const orderTitle = createParagraph(...useStyle('purchaseTitle'));
    getEventById(orderData.eventId).then((data) => {
      orderTitle.innerText = kebabCase(data.eventName);
    });
    order.appendChild(orderTitle);
  
    const orderNrOfTickets = createInput(...useStyle('purchaseQuantity'));
    orderNrOfTickets.type = 'number';
    orderNrOfTickets.min = '1';
    orderNrOfTickets.value = `${orderData.numberOfTickets}`;
    orderNrOfTickets.disabled = true;
  
    const orderNrOfTicketsWrapper = createDiv(...useStyle('purchaseQuantityWrapper'));
    orderNrOfTicketsWrapper.append(orderNrOfTickets);
    order.appendChild(orderNrOfTicketsWrapper);
  
    const orderType = createSelect(...useStyle('purchaseType'));
    orderType.setAttribute('disabled', 'true');

    const event = await getEventById(orderData.eventId);
    const categories = event.ticketCategories;

    const categoriesOptions = categories.map(
      (ticketCategory) => 
      `<option class = "text-sm font-bold text-black" value=${ticketCategory.ticketCategoryId} ${
        ticketCategory.ticketCategoryId === orderData.ticketCategoryId ? 'selected' : ''
      }>${ticketCategory.ticketCategoryDescription}</option>`
    ).join('\n');
    
    orderType.innerHTML = categoriesOptions;
    const orderTypeWrapper = createDiv(...useStyle('purchaseTypeWrapper'));
    orderTypeWrapper.append(orderType);
    order.appendChild(orderTypeWrapper);
  
    const orderDate = createDiv(...useStyle('purchaseDate'));
    orderDate.innerText = new Date(orderData.timestamp).toLocaleDateString();
    order.appendChild(orderDate);
  
    const orderPrice = createDiv(...useStyle('purchasePrice'));
    orderPrice.innerText = orderData.totalPrice;
    order.appendChild(orderPrice);
    const actions = createDiv(...useStyle('actions'));
  
    const editButton = createButton([...useStyle(['actionButton', 'editButton'])], '<i class="fa-solid fa-pen-to-square"></i>', editHandler);
    actions.appendChild(editButton);
  
    const confirmButton = createButton([...useStyle(['actionButton', 'hiddenButton', 'saveButton'])], '<i class="fa-solid fa-circle-check"></i>', confirmHandler);
    actions.appendChild(confirmButton);
  
    const cancelButton = createButton([...useStyle(['actionButton', 'hiddenButton', 'cancelButton'])], '<i class="fa-solid fa-ban"></i>', cancelHandler);
    actions.appendChild(cancelButton);
  
    const deleteButton = createButton([...useStyle(['actionButton', 'deleteButton'])], '<i class="fa-solid fa-trash"></i>', deleteHandler);
    actions.appendChild(deleteButton);
  
    order.appendChild(actions);
  
    function createDiv(...classes) {
        const div = document.createElement('div');
        div.classList.add(...classes);
        return div;
      }
      
      function createParagraph(...classes) {
        const p = document.createElement('p');
        p.classList.add(...classes);
        return p;
      }
      
      function createInput(...classes) {
        const input = document.createElement('input');
        input.classList.add(...classes);
        return input;
      }
      
      function createSelect(...classes) {
        const select = document.createElement('select');
        select.classList.add(...classes);
        return select;
      }
      
      function createButton(classes, innerHTML, handler) {
        const button = document.createElement('button');
        button.classList.add(...classes);
        button.innerHTML = innerHTML;
        button.addEventListener('click', handler);
        return button;
      }
      
      function editHandler() {
        if (confirmButton.classList.contains('hidden') && cancelButton.classList.contains('hidden')) {
          confirmButton.classList.remove('hidden');
          cancelButton.classList.remove('hidden');
          orderType.removeAttribute('disabled');
          orderNrOfTickets.removeAttribute('disabled');
          editButton.classList.add('hidden');
        }
      }
      
      function cancelHandler() {
        confirmButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
        editButton.classList.remove('hidden');
        orderType.setAttribute('disabled', 'true');
        orderNrOfTickets.setAttribute('disabled', 'true');

        orderNrOfTickets.value = orderData.numberOfTickets;
        Array.from(orderType.options).forEach(function (element, index) {
          if(element.value === orderData.ticketCategoryId) {
            orderType.options.selectedIndex = index;
            return;
          }
        });
      }
      
      function confirmHandler() {
        const newType = orderType.value;
        const newNrOfTickets = orderNrOfTickets.value;
        if (newType != orderData.ticketCategoryId || newNrOfTickets != orderData.numberOfTickets) {
          updateOrder(orderData.orderId, newType, newNrOfTickets)
            .then((result) => {
              if(result.status === 200){
                result.json().then((data) => {
                  orderData = data;
                  orderPrice.innerHTML = orderData.totalPrice;
                  orderDate.innerHTML = new Date(orderData.orderedAt).toLocaleDateString();
                })
                
              }
            })
            .catch((err) => {
              console.error(err);
            })
            .finally(() => {

            });
        }

        confirmButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
        editButton.classList.remove('hidden');
        orderType.setAttribute('disabled', 'true');
        orderNrOfTickets.setAttribute('disabled', 'true');
      }
      
      function deleteHandler() {
        fetch(`https://localhost:7268/api/Order/DeleteOrder?id=${orderData.orderId}`, {
          method:'DELETE',
          headers:{
            'Content-Type': 'application/json',
          }
        })
        .then(() => {
          const orderToRemove = document.getElementById(`order-${orderData.orderId}`);
          orderToRemove.remove();
          toastr.success("Order Deleted!");
        })
        .finally(() => {

        })
      }
      
      async function getEventById (eventId) {
        const respone = await fetch(`https://localhost:7268/api/Event/GetEventById?id=${eventId}`);
        const data = await respone.json();
        return data;
      }

      function updateOrder(orderId, type, numberOfTickets) {
        return fetch('https://localhost:7268/api/Order/PatchOrder',{
          method:'PATCH',
          headers:{
            'Content-Type':'application/json',
          },
          body: JSON.stringify({
            orderId:orderId,
            ticketCategoryId:type,
            numberOfTickets:numberOfTickets
          })
        }).then((result) => {
          if (result.status === 200) {
            toastr.success("Update Successful!");
          } else {
            toastr.error("Update Failed");
          }

          return result;
        })
        .catch((err) => {
          throw new Error(err);
        });
      }

    return order;
  }