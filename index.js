const consultURLMudi = 'https://viewer.mudi.com.co:3589/api/mudiV1';
const nameCurrentCompany = location.host.split('.')[1] || 'prueba';

/** Función para poner una nueva fecha local ✅*/
function localDater() {
  let year = new Date().getFullYear();
  let Mont = new Date().getMonth() + 1;
  let day = new Date().getDate();
  let hour = new Date().getHours();
  let minute = new Date().getMinutes();
  let secs = new Date().getSeconds();

  Mont < 10 && (Mont = `0${Mont}`);
  day < 10 && (day = `0${day}`);
  hour < 10 && (hour = `0${hour}`);
  minute < 10 && (minute = `0${minute}`);
  secs < 10 && (secs = `0${secs}`);

  return `${year}-${Mont}-${day} ${hour}:${minute}:${secs}`;
};

// ----------------------------------------------------------------------------
/**                                 MUDI USER                                */
// ----------------------------------------------------------------------------

/** Objeto Usuario de Mudi ✅*/
class Mudi_User {

  // attr Private
  #idUser

  constructor() {
    this.#idUser;
  };

  /** Modificamos el id del usuario */
  set setIdUser(id) {
    if (!id) return;
    this.#idUser = id
  };

  /** Retornamos el id del usuario en cuestión */
  get getIdUser() {
    return this.#idUser;
  };

  /** Creación de un nuevo usuario DB MUDI */
  async createNewUser() {
    try {
      const request = await fetch(`${consultURLMudi}/createUserAmoblandoPullman`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" }
      })
      const response = await request.json();
      this.setIdUser = response.data.insertId;
      localStorage.setItem('Tracker_Mudi_idUser', response.data.insertId);
    } catch (error) {
      console.error(error);
      console.error(`Mudi error: Error al crear el usuario Mudi`);
    };

  };

  /** Verificamos si el usuario tiene información antigua */
  async verifyUser() {
    const localInfo = localStorage.getItem('Tracker_Mudi_idUser');
    localInfo
      ? this.setIdUser = localInfo
      : await this.createNewUser();
  };

};

/** Instanciacion del objeto en el site */
const mudi_user = new Mudi_User();
await mudi_user.verifyUser();


// ----------------------------------------------------------------------------
/**                                 MUDI SESSION                              */
// ----------------------------------------------------------------------------

/** Objeto para crear una sesión en Mudi  ✅*/
class Mudi_Sesion {

  #idSession;

  constructor() {
    this.#idSession;
  };

  /** retornar la sesión actual */
  get getIdSession() {
    return this.#idSession;
  };

  /** Actualizar el idSession */
  set setIdSession(idSession) {
    if (!idSession) return;
    this.#idSession = idSession
  };

  /** Método para obtener la ciudad de la consulta  */
  async geolocalization() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const responseJSON = await response.json();
      return responseJSON.city
    } catch (error) {
      console.error(`MudiError: no pudimos conectar con el api`)
      console.error(error)
    }

  };

  /** Método para obtener el dispositivo de la consulta x ancho de pantalla */
  getDevice() {
    if (window.innerWidth > 1025) {
      return 'DESK'
    } else if (window.innerWidth <= 1024 && window.innerWidth >= 600) {
      return 'TABLET'
    } else {
      return 'MOBILE'
    }
  };

  /** Crea una nueva sesión y actualiza los datos locales */
  async createNewSession() {

    const geoLoc = await this.geolocalization();

    const dataBody = {
      id_user: mudi_user.getIdUser,
      device: this.getDevice(),
      company: nameCurrentCompany,
      location: geoLoc || 'undefined'
    };

    try {

      const request = await fetch(`${consultURLMudi}/createSessionAmoblandoPullman`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataBody)
      });
      const response = await request.json();
      this.setIdSession = response.data.insertId;

      /** Colocamos los valores actualizados en local */
      localStorage.setItem('Tracker_Mudi_idSession', response.data.insertId);
      localStorage.setItem('Tracker_Mudi_SessionDate', localDater());
      localStorage.setItem('Tracker_Mudi_interactionSession', '0');

    }
    catch (error) {
      console.error(error);
      console.error(`Mudi error: erro alc rear la nueva sesión`)
    };

  };

  /** Verificación de sesión */
  async verifySesionExist() {

    const lastLocalDate = localStorage.getItem('Tracker_Mudi_SessionDate');

    if (lastLocalDate) {

      const lastDate = new Date(lastLocalDate.replace(' ', 'T'));
      const currentLocalDate = new Date();

      const diference = currentLocalDate - lastDate;
      const parseMinutes = diference / (1000 * 60);

      parseMinutes > 30
        ? this.createNewSession()
        : (
          localStorage.setItem('Tracker_Mudi_SessionDate', localDater()),
          this.setIdSession = localStorage.getItem('Tracker_Mudi_idSession')
        );

    }
    else { this.createNewSession() };

  };

};

const mudi_session = new Mudi_Sesion();
await mudi_session.verifySesionExist();

// ----------------------------------------------------------------------------
/**                                 MUDI PAGES                               */
// ----------------------------------------------------------------------------


/** Objeto para el comportamiento por página visitada */
class Mudi_Page {

  #idPage

  constructor() {
    this.#idPage;
    this.myInterval;
    this.timeSession = 0;
  };

  set setIdPage(idPage) {
    if (!idPage) return;
    this.#idPage = idPage;
  };

  get getIdPage() {
    return this.#idPage;
  };

  /** Método para contabilizar el tiempo en la pagina de usuario. */
  setCounterTimeSession() {
    this.myInterval = setInterval(() => {
      this.timeSession++;
      if (this.timeSession == 5) this.updateTimeSession();
      else if (this.timeSession % 15 == 0) this.updateTimeSession();
    }, 1000);
  };

  /** Método para para el tiempo del usuario */
  stopInteval() {
    clearInterval(this.myInterval);
    this.myInterval = null;
  };

  /** Método que nos permite iniciar el tracking al momento que se abre la página */
  async initPageTrack() {

    this.setCounterTimeSession();

    const data = {
      id_session: mudi_session.getIdSession,
      path: location.pathname
    };

    if (location.pathname == '/checkout' || location.pathname == '/cart') return;

    try {
      const request = await fetch(`${consultURLMudi}/createPageViewAmoblandoPullman`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const response = await request.json();
      this.setIdPage = response.data.insertId;
      console.log(this.getIdPage)
    } catch (error) {
      console.error(error);
      console.error(`Mudi Erro: no se pudo crear el registro de la página en MUDI`)
    };

  };

  /* 
    -----------------------------------------------------------------  
                               Métodos
    -----------------------------------------------------------------  
  */

  /** Método para actualizar el tiempo de la sesión */
  async updateTimeSession() {

    const dataBody = {
      time_session: this.timeSession,
      idPagina: this.getIdPage
    };

    try {
      const request = await fetch(`${consultURLMudi}/updatePageTimeSession`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataBody)
      });
    } catch (error) {
      console.error(error);
      console.error(`Mudi Error: Actualziación del tiempo de sesión`)
    };

  };

  /** Método para actualizar el add To Car */
  async updateAddToCar() {

    const dataBody = {
      addToCar: 1,
      idPagina: this.getIdPage
    };

    try {
      const request = await fetch(`${consultURLMudi}/updatePageAddToCar`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataBody)
      });
    } catch (error) {
      console.error(error);
      console.error(`Mudi Error: Actualziación del add to car`)
    };

  };

  /** Método para actualizar el tiempo de la sesión */
  async updateSize() {

    const dataBody = {
      interactionSize: 1,
      idPagina: this.getIdPage
    };

    try {
      const request = await fetch(`${consultURLMudi}/updatePageUpdateSize`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataBody)
      });
    } catch (error) {
      console.error(error);
      console.error(`Mudi Error: Actualziación del Size`)
    };

  };

  /** Método para actualizar el tiempo de la sesión */
  async updateColor() {

    const dataBody = {
      interactionColor: 1,
      idPagina: this.getIdPage
    };

    try {
      const request = await fetch(`${consultURLMudi}/updatePageUpdateColor`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataBody)
      });
    } catch (error) {
      console.error(error);
      console.error(`Mudi Error: Actualziación del Color`)
    };

  };

  /** Método para actualizar el boton de AR */
  async updateBtnAR() {

    const dataBody = {
      interactionAR: 1,
      idPagina: this.getIdPage
    };

    try {
      const request = await fetch(`${consultURLMudi}/updatePageUpdateAR`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataBody)
      });
    } catch (error) {
      console.error(error);
      console.error(`Mudi Error: Actualziación del Color`)
    };

  };

  /** Método para actualizar el boton de AR */
  async updateBtn3D() {

    const dataBody = {
      interaction3D: 1,
      idPagina: this.getIdPage
    };

    try {
      const request = await fetch(`${consultURLMudi}/updatePageUpdate3D`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataBody)
      });
    } catch (error) {
      console.error(error);
      console.error(`Mudi Error: Actualziación del Color`)
    };

  };

};

const mudi_page = new Mudi_Page();
mudi_page.initPageTrack();
window.mudiPage = mudi_page;


// ----------------------------------------------------------------------------
/**                                 MUDI PURCHASE                             */
// ----------------------------------------------------------------------------

/** Objeto encargado de las trassacciones del site */
class Mudi_Purchase {

  /** Método para sacar la totalidad de los productos ✅*/
  detailsPurchase() {
    const totalProductos = document.querySelectorAll('.media');
    let products = [];
    totalProductos.forEach(node => {
      const childrens = node.querySelector('.media-content-details').children;
      const name = node.querySelector('.media-heading').innerText || 'Nombre no disponible';
      const skuProduct = childrens[1].innerText || 'SKU no disponible';
      const quantity = childrens[childrens.length - 1].innerText;
      const price = node.querySelector('.media-price').innerHTML.replace('$', '').replace(/\./g, '').trim() || 'Total no disponible';
      products.push({ name, skuProduct, quantity, price });
    });
    return products;
  };

  /** Método para el resumen de la transacción ✅*/
  verifyPurchase() {

    if (location.pathname == '/checkout') {

      setTimeout(() => {
        const totalProducts = this.detailsPurchase();

        /** data for purchase */
        const data = {
          id_session: localStorage.getItem('Tracker_Mudi_idSession'),
          id_user: localStorage.getItem('Tracker_Mudi_idUser'),
          idOrder: document.querySelector("#fc-ei").value,
          subTotalValue: document.querySelector('[data-subtotal-tax]').innerHTML.replace('$', '').replace(/\./g, ""),
          travelValue: document.getElementById('data-shipping').innerText.replace('$', '').replace(/\./g, ""),
          ivaValue: document.getElementById('data-iva').innerHTML.replace('$', '').replace(/\./g, ""),
          company: nameCurrentCompany,
          interacionUser: localStorage.getItem('Tracker_Mudi_interactionSession'),
          detailProductsPurchase: totalProducts
        };

        this.clickButonPurchase(data);

      }, 2500)

    };

  };

  clickButonPurchase(data) {

    document.body.querySelector('.send-event-purchase').addEventListener('click', async () => {
      debugger;
      try {
        const request = await fetch(`${consultURLMudi}/createPurchaseAmoblandoPullman`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        })
      } catch (error) {
        console.error(error);
        console.error(`Mudi Error: Error al  mandar el purchase a la base de datos MUDI`)
      };
    });

  };

};

const mudi_purchase = new Mudi_Purchase();
mudi_purchase.verifyPurchase();



window.addEventListener('visibilitychange', () => {
  mudi_page.updateTimeSession();
  document.visibilityState === 'visible' ? mudi_page.setCounterTimeSession() : mudi_page.stopInteval();
});
