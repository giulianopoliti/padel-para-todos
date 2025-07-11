Estoy trabajando en una aplicación donde los clubes pueden organizar torneos.
Tengo dos páginas:

/tournaments: muestra todos los torneos públicos.

/tournaments/my-tournaments: muestra los torneos organizados por el club logueado.

Actualmente, los clubes solo pueden editar torneos desde /my-tournaments, lo cual es confuso.

🎯 Lo que quiero implementar
Quiero que desde /tournaments/[id], si el club está logueado y ese torneo le pertenece, pueda modificarlo directamente desde esa misma vista, con las mismas funcionalidades de edición que ya existen.

Si el torneo no le pertenece, debe mantener el modo solo lectura (como ahora).

🧠 Requisitos clave
✅ Detectar si el usuario actual está logueado como club.

✅ Verificar si el torneo corresponde a ese club.

✅ Si sí, mostrar los componentes de edición (botones, inputs, formularios, etc.).

✅ Si no, mantener el modo solo lectura como actualmente.

✅ Que el componente de torneo reutilice los mismos subcomponentes (no duplicar lógica de edición).

✅ No romper la vista actual de /my-tournaments, pero puede quedar solo como acceso directo a los torneos propios.

🛠️ Sugerencias técnicas
Podés usar un prop como editable: boolean para pasarle al componente de torneo si debe renderizarse editable o no.

Usá un hook como useIsTorneoEditable(torneo, user) que encapsule la lógica de permisos y sea reutilizable.
Quiero que usemos el usercontext que se utiliza en la navbar.

Evitá tener ramas if o JSX duplicado. Lo ideal sería que el componente ya sepa si debe estar en modo edición.
Tene en cuenta que hay una page de @club en tournaments, que es probable que se este renderizando cuando estas logeado como club, no la borremos aun, cambiemosle el nombre a la folder. Ya que un club que no es propietario del torneo no deberia poder editar, es decir deberia ver la vista publica. 


✨ UX Final deseada
Cuando un club entra a un torneo que organizó, lo puede administrar desde la misma página /tournaments/[id].
Quiero que la pagina de un club si es propietario del torneo en tournaments/id, sea igual a la vista de /tournaments/my-tournaments/id. 

Si entra a un torneo ajeno, ve la info normalmente pero sin opción de editar.

/my-tournaments sigue existiendo, pero solo como vista de acceso rápido.

Quiero que primero idees un plan de accion y me digas como funciona ahora exactamente, no veo una parallel route para clubes, pero si me logeo como club funciona, quiero que lo hagamos de una manera escalable y que entienda. Primero explicame todo.
