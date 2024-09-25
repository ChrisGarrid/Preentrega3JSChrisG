document.addEventListener('DOMContentLoaded', function () {
    const RESERVATION_LIMIT_PER_HOUR = 10; // Límite de reservas por hora

    // Cargar el menú desde un archivo JSON local
    fetch('menu.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar el menú. Verifique que el archivo JSON esté en la ubicación correcta.');
            }
            return response.json();
        })
        .then(data => {
            const dishOptions = document.getElementById('dishOptions');
            
            if (!dishOptions) {
                console.error('El contenedor de opciones de platos no está presente en el DOM.');
                return;
            }

            // Iterar sobre cada plato y renderizar su contenido
            data.forEach(dish => {
                // Crear contenedor para cada plato
                const dishContainer = document.createElement('div');
                dishContainer.className = 'dish-container';

                // Crear imagen
                const image = document.createElement('img');
                image.src = dish.imagen;
                image.alt = dish.nombre;
                image.className = 'dish-image';

                // Crear label para nombre y precio
                const label = document.createElement('label');
                label.textContent = `${dish.nombre} - $${dish.precio}`;

                // Crear input para cantidad
                const input = document.createElement('input');
                input.type = 'number';
                input.min = 0;
                input.value = 0;
                input.dataset.dish = dish.nombre;
                input.addEventListener('input', validateDishSelection);

                // Añadir imagen, label e input al contenedor del plato
                dishContainer.appendChild(image);
                dishContainer.appendChild(label);
                dishContainer.appendChild(input);

                // Añadir el contenedor del plato al contenedor de opciones de platos
                dishOptions.appendChild(dishContainer);
                dishOptions.appendChild(document.createElement('br')); // Saltos de línea entre platos
            });
        })
        .catch(error => {
            console.error('Error cargando el menú:', error);
            alert('No se pudo cargar el menú. Por favor, intente nuevamente.');
        });

    // Clases para manejar las reservas y platos
    class Reservation {
        constructor(clientName, numOfGuests, time) {
            this.clientName = clientName;
            this.numOfGuests = numOfGuests;
            this.time = time;
            this.dishes = [];
        }

        addDishes(dishes) {
            const totalDishes = dishes.reduce((total, dish) => total + dish.quantity, 0);
            return totalDishes > this.numOfGuests ? false : (this.dishes = dishes, true);
        }

        showInfo() {
            const { clientName, numOfGuests, time, dishes } = this;
            const dishInfo = dishes.map(dish => `${dish.quantity}x ${dish.name}`).join(", ");
            return `Cliente: ${clientName}, Número de invitados: ${numOfGuests}, Hora: ${time}, Platos: ${dishInfo}`;
        }
    }

// Clase para gestionar las reservas con Local Storage
class ReservationManager {
    constructor() {
        this.reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        // Asegúrate de que las reservas sean instancias de Reservation
        this.reservations = this.reservations.map(res => {
            return Object.assign(new Reservation(), res);
        });
    }

    // Método para añadir una reserva
    addReservation(reservation) {
        const reservationsAtThisHour = this.getReservationsByHour(reservation.time);
        if (reservationsAtThisHour.length >= RESERVATION_LIMIT_PER_HOUR) {
            return false; // Si el límite de reservas ha sido alcanzado
        }

        // Añadir la reserva al array de reservas
        this.reservations.push(reservation);
        localStorage.setItem('reservations', JSON.stringify(this.reservations));
        console.log('Reservas en Local Storage:', this.reservations); // Para depuración
        return true;
    }

    // Mostrar las reservas en el DOM
    showReservations() {
        const reservationList = document.getElementById('reservationList');
        reservationList.innerHTML = ''; // Limpiar la lista antes de mostrar
        if (this.reservations.length === 0) {
            reservationList.innerText = "No hay reservas en la lista de hoy.";
        } else {
            this.reservations.forEach(reservation => {
                const listItem = document.createElement('li');
                listItem.textContent = reservation.showInfo();
                reservationList.appendChild(listItem);
            });
        }
    }
}
    // Crear una instancia de ReservationManager
    const manager = new ReservationManager();
    let currentReservation = null;

    window.addReservation = function () {
        const clientName = document.getElementById('clientName').value;
        const numOfGuests = document.getElementById('numOfGuests').value;
        const time = document.getElementById('time').value;

        clientName && numOfGuests && time
            ? (
                currentReservation = new Reservation(clientName, numOfGuests, time),
                document.getElementById('menuForm').style.display = 'block',
                document.getElementById('reservationForm').style.display = 'none',
                document.getElementById('maxDishes').textContent = numOfGuests
            )
            : alert("Por favor, completa todos los campos de la reserva.");
    }

    function validateDishSelection() {
        const dishInputs = document.querySelectorAll('#dishOptions input[type="number"]');
        const totalDishes = Array.from(dishInputs).reduce((total, input) => total + parseInt(input.value), 0);
        const confirmOrderBtn = document.getElementById('confirmOrderBtn');

        totalDishes > parseInt(currentReservation.numOfGuests)
            ? confirmOrderBtn.disabled = true
            : confirmOrderBtn.disabled = totalDishes !== parseInt(currentReservation.numOfGuests);

        confirmOrderBtn.style.backgroundColor = confirmOrderBtn.disabled ? '#ccc' : '#007BFF';
    }

    window.addMenu = function () {
        const dishInputs = document.querySelectorAll('#dishOptions input[type="number"]');
        const selectedDishes = Array.from(dishInputs)
            .filter(input => parseInt(input.value) > 0)
            .map(({ dataset: { dish }, value }) => ({
                name: dish,
                quantity: parseInt(value)
            }));

        if (selectedDishes.length > 0) {
            const success = currentReservation.addDishes(selectedDishes);
            const reservationAdded = success && manager.addReservation(currentReservation);

            reservationAdded
                ? showConfirmationMessage(currentReservation.showInfo())
                : alert(`No se puede añadir la reserva. Se ha alcanzado el límite de ${RESERVATION_LIMIT_PER_HOUR} reservas para la hora ${currentReservation.time}.`);
        } else {
            alert("Por favor, selecciona al menos un plato.");
        }
    }

    function showConfirmationMessage(info) {
        document.getElementById('menuForm').style.display = 'none';
        document.getElementById('confirmationMessage').style.display = 'block';
        document.getElementById('confirmationText').textContent = info;
    }

    window.newReservation = function () {
        document.getElementById('confirmationMessage').style.display = 'none';
        document.getElementById('reservationForm').style.display = 'block';
        document.getElementById('clientName').value = '';
        document.getElementById('numOfGuests').value = '';
        document.getElementById('time').value = '';
        document.querySelectorAll('#dishOptions input[type="number"]').forEach(input => input.value = 0);
    }

    window.acceptReservation = function () {
        document.getElementById('confirmationMessage').style.display = 'none';
        alert("Reserva aceptada.");
    }

    window.showReservations = function () {
        manager.showReservations();
    }

    // Funcionalidad del botón de toggle para dispositivos móviles
    document.querySelector('.menu-toggle').addEventListener('click', function () {
        document.querySelector('.navbar').classList.toggle('active');
    });
});
console.log("Platos seleccionados:", selectedDishes);
console.log("Reservas actuales:", manager.reservations);