import { formatDate } from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import { ROUTES_PATH } from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from "./Logout.js"

export const filteredBills = (data, status) => {
  return (data && data.length) ?
    data.filter(bill => {
      let selectCondition

      // in jest environment
      if (typeof jest !== 'undefined') {
        selectCondition = (bill.status === status)
      }
      /* istanbul ignore next */
      else {
        // in prod environment
        const userEmail = JSON.parse(localStorage.getItem("user")).email
        selectCondition =
          (bill.status === status) &&
          ![...USERS_TEST, userEmail].includes(bill.email)
      }

      return selectCondition
    }) : []
}

export const card = (bill) => {
  const firstAndLastNames = bill.email.split('@')[0]
  const firstName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[0] : ''
  const lastName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[1] : firstAndLastNames

  return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

export const cards = (bills) => {
  return bills && bills.length ? bills.map(bill => card(bill)).join("") : ""
}

export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending"
    case 2:
      return "accepted"
    case 3:
      return "refused"
  }
}

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    $('#arrow-icon1').on("click", (e) => this.handleShowTickets(e, bills, 1))
    $('#arrow-icon2').on("click", (e) => this.handleShowTickets(e, bills, 2))
    $('#arrow-icon3').on("click", (e) => this.handleShowTickets(e, bills, 3))
    this.counter = [null, false, false, false]; // this.counter === [null, false, true, false] signifie que les bills 
    // validées (this.counter[2]) sont dépliées (=== true, false si repliées)       
    new Logout({ localStorage, onNavigate })
  }

  handleClickIconEye = () => {
    const billUrl = $('#icon-eye-d').attr("data-bill-url")
    const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8)
    $('#modaleFileAdmin1').find(".modal-body").html(`<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`)
    if (typeof $('#modaleFileAdmin1').modal === 'function') $('#modaleFileAdmin1').modal('show')
  }

  handleEditTicket(e, bill) {
    console.log(bill.id)
    //if (this.counter === undefined || this.id !== bill.id) this.counter = 0
    if ((this.lastId && bill.id !== this.lastId) || !this.lastId) { // Si une bill est sélectionnée et on sélectionne 
      // une bill différente de la bill sélectionnée (courante) ou si aucune bill n'est sélectionnée        
      if (this.lastId) { // S'il y a une bill déjà sélectionnée
        $(`#open-bill${this.lastId}`).css({ background: '#0D5AE5' }) // déselectionner la dernière bill sélectionnée                   
      }
      $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })  // sélectionner la nouvelle 
      $('.dashboard-right-container div').html(DashboardFormUI(bill))
      $('#icon-eye-d').on('click', this.handleClickIconEye)
      $('#btn-accept-bill').on('click', (e) => this.handleAcceptSubmit(e, bill))
      $('#btn-refuse-bill').on('click', (e) => this.handleRefuseSubmit(e, bill))
      this.lastId = bill.id;
    } else {
      $(`#open-bill${this.lastId}`).css({ background: '#0D5AE5' })
      $('.dashboard-right-container div').html(`
      <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `)
      this.lastId = undefined;
    }
  }

  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'accepted',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'refused',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  handleShowTickets(e, bills, index) {
    this.counter[index] = !this.counter[index]
    const bills_filtres = filteredBills(bills, getStatus(index));
    if (this.counter[index]) { // afficher les bills filtrées
      $(`#arrow-icon${index}`).css({ transform: 'rotate(0deg)' })
      $(`#status-bills-container${index}`).html(cards(bills_filtres))
      $('.vertical-navbar').css({ height: '150vh' })
      bills_filtres.forEach((bill) => {
        if (this.lastId && this.lastId === bill.id) // on rouvre un groupe de bills alors qu'une bill était active
          $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })
        $(`#open-bill${bill.id}`).on('click', (e) => this.handleEditTicket(e, bill))
      })      
    } else { // masquer les bills filtrées
      $(`#arrow-icon${index}`).css({ transform: 'rotate(90deg)' })
      $(`#status-bills-container${index}`)
        .html("")
    }
  }

  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then(snapshot => {
          const bills = snapshot
            .map(doc => ({
              id: doc.id,
              ...doc,
              date: doc.date,
              status: doc.status
            }))
          return bills
        })
        .catch(error => {
          throw error;
        })
    }
  }

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      return this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: bill.id })
        .then(bill => bill)
        .catch(console.log)
    }
  }
}
