import Swal from 'sweetalert2';

const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

const baseOptions = () => {
  const light = isLight();
  return {
    background: light ? '#f8fafc' : '#0f172a',
    color: light ? '#0f172a' : '#f1f5f9',
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    customClass: {
      popup: 'lifetag-swal-popup',
      title: 'lifetag-swal-title',
      htmlContainer: 'lifetag-swal-html',
    },
  };
};

export function showSwalLoading(title) {
  Swal.fire({
    ...baseOptions(),
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeSwal() {
  Swal.close();
}

export async function swalSuccess(opts = {}) {
  await Swal.fire({
    ...baseOptions(),
    icon: 'success',
    timer: opts.timer ?? 2200,
    timerProgressBar: true,
    showConfirmButton: false,
    title: opts.title,
    text: opts.text,
  });
}

export async function swalError(title, text) {
  await Swal.fire({
    ...baseOptions(),
    icon: 'error',
    title,
    text: text || undefined,
    confirmButtonText: 'OK',
  });
}

export async function swalWarning(title, text) {
  await Swal.fire({
    ...baseOptions(),
    icon: 'warning',
    title,
    text: text || undefined,
    confirmButtonText: 'OK',
  });
}

/** @returns {Promise<boolean>} */
export async function swalConfirmLogout(title, text, confirmText, cancelText) {
  const r = await Swal.fire({
    ...baseOptions(),
    icon: 'question',
    title,
    text: text || undefined,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
  });
  return r.isConfirmed;
}

export async function swalSessionExpired(title) {
  await Swal.fire({
    ...baseOptions(),
    icon: 'info',
    title,
    confirmButtonText: 'OK',
  });
}
