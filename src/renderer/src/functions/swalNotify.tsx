import Swal from 'sweetalert2';

const fireBaseToken = '5060c33c-299f-4f17-8882-d237f2b9260f';
const fireBaseUrl = 'https://firebasestorage.googleapis.com/v0/b/ola-dev-2c0b9.appspot.com/o/';

export const getFireBaseUrl = (filename: string, kind?: string) => (
  filename.startsWith('https://') ? filename : `${fireBaseUrl}${kind ? `files%2F${kind}%2F` : ''}${filename}?alt=media&token=${fireBaseToken}`
);

const swalNotify = ({
  fullname, remainingSessions, subscription, subscriptionEndDate, type, avatar,
}) => {
  Swal.fire({
    html: `
    <div class="user-check">
      <div class="flex">
        <img src="${getFireBaseUrl(avatar, 'users_pictures')}" />
        <div class="user-info">
        ${type === 'in' ? "<h4>Abonné(e) viens d'entrer</h4>" : ''} 
        ${type === 'out' ? '<h4>Abonné(e) viens de sortir</h4>' : ''}
          <p class="information">Nom d'abonné(e) : <span>${fullname}</span></p>
          ${type === 'in' ? (`
            <p class="information">Séances restantes : <span>${remainingSessions}</span></p>
            <p class="information">Abonnement : <span>${subscription}</span></p>
            <p class="information">Fin d'abonnement : <span>${subscriptionEndDate}</span></p>
          `) : ''}
        </div>
      </div>
    </div>
    `,
    position: 'top-right',
    showConfirmButton: false,
    showCancelButton: false,
    toast: true,
    showCloseButton: true,
    timer: 10000,
    buttonsStyling: false,
    customClass: {
      popup: 'swal-check',
      container: 'swal-custom-container',
      htmlContainer: 'swal-custom-html-container',
      closeButton: 'close-button',
      confirmButton: 'green-button',
      cancelButton: 'red-button',
    },
  });
};

export default swalNotify;
