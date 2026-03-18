document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-task');
    const taskInput = document.getElementById('task-input');
    const priorityInput = document.getElementById('priority-input');
    const dueDateInput = document.getElementById('due-date-input');
    const tasksList = document.getElementById('tasks-list');

    // Load tasks on page load
    loadTasks();

    addBtn.addEventListener('click', async () => {
        const task = taskInput.value.trim();
        const priority = priorityInput.value;
        const dueDate = dueDateInput.value;
        if (!task || !dueDate) return;

        await fetch('/timetable/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, priority, due_date: dueDate })
        });
        taskInput.value = '';
        priorityInput.value = '';
        dueDateInput.value = '';
        loadTasks();
    });

    // Event delegation for edit and delete
    tasksList.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('edit-btn')) {
            // Simple edit: prompt for new values (in production, use a modal)
            const newTask = prompt('New task:');
            const newPriority = prompt('New priority (1-5):');
            const newDueDate = prompt('New due date (YYYY-MM-DDTHH:MM):');
            if (newTask && newPriority && newDueDate) {
                await fetch(`/timetable/edit/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task: newTask, priority: newPriority, due_date: newDueDate })
                });
                loadTasks();
            }
        } else if (e.target.classList.contains('delete-btn')) {
            await fetch(`/timetable/delete/${id}`, { method: 'DELETE' });
            loadTasks();
        }
    });

    async function loadTasks() {
        const response = await fetch('/timetable/tasks');
        const tasks = await response.json();
        tasksList.innerHTML = '';
        tasks.forEach(t => {
            const div = document.createElement('div');
            div.className = 'task-item flex justify-between items-center';
            div.innerHTML = `
                <div>
                    <p class="font-semibold">${t.task}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Priority: ${t.priority} | Due: ${new Date(t.due_date).toLocaleString()}</p>
                </div>
                <div>
                    <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded mr-2 transition" data-id="${t.id}">Edit</button>
                    <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition" data-id="${t.id}">Delete</button>
                </div>
            `;
            tasksList.appendChild(div);
        });
    }
});