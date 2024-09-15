document.addEventListener('DOMContentLoaded', function () {
    // Cargar el menú desde un archivo JSON local
    fetch('menu.json')
        .then(response => response.json())
        .then(data => {
            const dishOptions = document.getElementById('dishOptions');
            data.forEach(dish => {
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = 'number';
                input.min = 0;
                input.value = 0;
                input.dataset.dish = dish.nombre;
                input.addEventListener('input', validateDishSelection);

                label.textContent = `${dish.nombre} - $${dish.precio}`;
                label.appendChild(input);
                dishOptions.appendChild(label);
                dishOptions.appendChild(document.createElement('br'));
            });
        });
        const RESERVATION_LIMIT_PER_HOUR = 10; // Límite de reservas por hora
    class Reservation {
        constructor(clientName, numOfGuests, time) {
            this.clientName = clientName;
            this.numOfGuests = numOfGuests;
            this.time = time;
            this.dishes = [];
        }

        addDishes(dishes) {
            const totalDishes = dishes.reduce((total, dish) => total + dish.quantity, 0);
            if (totalDishes > this.numOfGuests) {
                return false;
            }
            this.dishes = dishes;
            return true;
        }

        showInfo() {
            const dishInfo = this.dishes.map(dish => `${dish.quantity}x ${dish.name}`).join(", ");
            return `Cliente: ${this.clientName}, Número de invitados: ${this.numOfGuests}, Hora: ${this.time}, Platos: ${dishInfo}`;
        }
    }

    class ReservationManager {
        constructor() {
            this.reservations = [];
        }
    
        addReservation(reservation) {
            const reservationsAtThisHour = this.getReservationsByHour(reservation.time);
            if (reservationsAtThisHour.length >= RESERVATION_LIMIT_PER_HOUR) {
                return false; // No se puede añadir la reserva porque se alcanzó el límite
            }
            this.reservations.push(reservation);
            return true;
        }
    
        getReservationsByHour(time) {
            return this.reservations.filter(reservation => reservation.time === time);
        }
    
        showReservations() {
            const reservationList = document.getElementById('reservationList');
            reservationList.innerHTML = ''; // Limpiar la lista antes de mostrar
            if (this.reservations.length === 0) {
                reservationList.innerText = "No hay reservas en la lista de hoy.";
            } else {
                const list = document.createElement('ul');
                this.reservations.forEach(reservation => {
                    const listItem = document.createElement('li');
                    listItem.textContent = reservation.showInfo();
                    list.appendChild(listItem);
                });
                reservationList.appendChild(list);
            }
        }
    }
    
    const manager = new ReservationManager();
    let currentReservation = null;

    window.addReservation = function () {
        const clientName = document.getElementById('clientName').value;
        const numOfGuests = document.getElementById('numOfGuests').value;
        const time = document.getElementById('time').value;

        if (clientName && numOfGuests && time) {
            currentReservation = new Reservation(clientName, numOfGuests, time);
            document.getElementById('menuForm').style.display = 'block';
            document.getElementById('reservationForm').style.display = 'none';

            // Actualizar el mensaje de límite de platos
            document.getElementById('maxDishes').textContent = numOfGuests;
        } else {
            alert("Por favor, completa todos los campos de la reserva.");
        }
    }

    function validateDishSelection() {
        const dishInputs = document.querySelectorAll('#dishOptions input[type="number"]');
        const totalDishes = Array.from(dishInputs).reduce((total, input) => total + parseInt(input.value), 0);
        const confirmOrderBtn = document.getElementById('confirmOrderBtn');

        if (totalDishes > parseInt(currentReservation.numOfGuests)) {
            confirmOrderBtn.disabled = true;
            confirmOrderBtn.style.backgroundColor = '#ccc';
        } else {
            confirmOrderBtn.disabled = totalDishes !== parseInt(currentReservation.numOfGuests);
            confirmOrderBtn.style.backgroundColor = confirmOrderBtn.disabled ? '#ccc' : '#007BFF';
        }
    }

    window.addMenu = function () {
        const dishInputs = document.querySelectorAll('#dishOptions input[type="number"]');
        const selectedDishes = Array.from(dishInputs)
            .filter(input => parseInt(input.value) > 0)
            .map(input => ({
                name: input.dataset.dish,
                quantity: parseInt(input.value)
            }));
    
        if (selectedDishes.length > 0) {
            const success = currentReservation.addDishes(selectedDishes);
            if (success) {
                const reservationAdded = manager.addReservation(currentReservation);
                if (reservationAdded) {
                    showConfirmationMessage(currentReservation.showInfo());
                } else {
                    alert(`No se puede añadir la reserva. Se ha alcanzado el límite de ${RESERVATION_LIMIT_PER_HOUR} reservas para la hora ${currentReservation.time}.`);
                    document.getElementById('menuForm').style.display = 'none';
                    document.getElementById('reservationForm').style.display = 'block';
                }
            } else {
                alert(`No puedes seleccionar más de ${currentReservation.numOfGuests} plato(s).`);
            }
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
