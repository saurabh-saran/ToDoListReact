import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
export default function Dashboard() {
  const [lists, setLists] = useState([]);
  const [tasksMap, setTasksMap] = useState({});
  const [newList, setNewList] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Track auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        navigate("/");
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]); // Fetch Lists + Tasks
  useEffect(() => {
    if (!user) return;
    const listsQuery = query(collection(db, "users", user.uid, "todoLists"));
    const unsubscribeLists = onSnapshot(listsQuery, (snapshot) => {
      const fetchedLists = [];
      snapshot.forEach((docSnap) => {
        fetchedLists.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLists(fetchedLists);
      fetchedLists.forEach((list) => {
        const taskQuery = query(
          collection(db, "users", user.uid, "todoLists", list.id, "tasks")
        );
        onSnapshot(taskQuery, (taskSnapshot) => {
          const tasks = [];
          taskSnapshot.forEach((taskDoc) =>
            tasks.push({ id: taskDoc.id, ...taskDoc.data() })
          );
          tasks.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
          setTasksMap((prev) => ({ ...prev, [list.id]: tasks }));
        });
      });
    });
    return () => unsubscribeLists();
  }, [user]); // Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  }; // Add new list
  const addList = async (e) => {
    e.preventDefault();
    if (!newList.trim() || !user) return;
    await addDoc(collection(db, "users", user.uid, "todoLists"), {
      name: newList,
      createdAt: new Date(),
    });
    setNewList("");
  }; // Add new task
  const addTask = async (listId, task) => {
    if (!user) return;
    await addDoc(
      collection(db, "users", user.uid, "todoLists", listId, "tasks"),
      {
        ...task,
        index: tasksMap[listId]?.length ?? 0,
        completed: false,
        createdAt: new Date(),
      }
    );
  }; // Delete task
  const deleteTask = async (listId, taskId) => {
    if (!user) return;
    await deleteDoc(
      doc(db, "users", user.uid, "todoLists", listId, "tasks", taskId)
    );
  }; // Toggle complete
  const toggleComplete = async (listId, taskId, current) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "todoLists", listId, "tasks", taskId),
      { completed: !current },
      { merge: true }
    );
  }; // Handle Drag & Drop
  const handleDragEnd = async (result) => {
    if (!user) return;
    const { source, destination } = result;
    if (!destination) return;
    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;
    if (sourceListId === destListId) {
      const updatedTasks = Array.from(tasksMap[sourceListId]);
      const [moved] = updatedTasks.splice(source.index, 1);
      updatedTasks.splice(destination.index, 0, moved);
      setTasksMap((prev) => ({ ...prev, [sourceListId]: updatedTasks }));
      updatedTasks.forEach(async (task, idx) => {
        const taskRef = doc(
          db,
          "users",
          user.uid,
          "todoLists",
          sourceListId,
          "tasks",
          task.id
        );
        await updateDoc(taskRef, { index: idx });
      });
    } else {
      const sourceTasks = Array.from(tasksMap[sourceListId] || []);
      const destTasks = Array.from(tasksMap[destListId] || []);
      const [moved] = sourceTasks.splice(source.index, 1);
      moved.index = destination.index;
      destTasks.splice(destination.index, 0, moved);
      setTasksMap((prev) => ({
        ...prev,
        [sourceListId]: sourceTasks,
        [destListId]: destTasks,
      }));
      const oldTaskRef = doc(
        db,
        "users",
        user.uid,
        "todoLists",
        sourceListId,
        "tasks",
        moved.id
      );
      await deleteDoc(oldTaskRef);
      await addDoc(
        collection(db, "users", user.uid, "todoLists", destListId, "tasks"),
        { ...moved, index: destination.index }
      );
      sourceTasks.forEach(async (task, idx) => {
        const ref = doc(
          db,
          "users",
          user.uid,
          "todoLists",
          sourceListId,
          "tasks",
          task.id
        );
        await updateDoc(ref, { index: idx });
      });
      destTasks.forEach(async (task, idx) => {
        const ref = doc(
          db,
          "users",
          user.uid,
          "todoLists",
          destListId,
          "tasks",
          task.id
        );
        await updateDoc(ref, { index: idx });
      });
    }
  };
  // return (
  //   <div className="dashboard">
  //          {" "}
  //     <div className="dashboard-header">
  //               <h1 className="text-3xl font-bold">Your To Do Lists 📝</h1>
  //        {" "}
  //       <button onClick={handleLogout} className="btn btn-danger">
  //                   Logout        {" "}
  //       </button>
  //            {" "}
  //     </div>
  //          {" "}
  //     <form onSubmit={addList} className="mb-4 flex gap-2">
  //              {" "}
  //       <input
  //         type="text"
  //         placeholder="Enter new list name"
  //         className="input"
  //         value={newList}
  //         onChange={(e) => setNewList(e.target.value)}
  //       />
  //               <button className="btn btn-primary">Add List</button>     {" "}
  //     </form>
  //          {" "}
  //     <DragDropContext onDragEnd={handleDragEnd}>
  //              {" "}
  //       <div className="dashboard-grid">
  //                  {" "}
  //         {lists.map((list) => (
  //           <Droppable key={list.id} droppableId={list.id}>
  //                          {" "}
  //             {(provided) => (
  //               <div
  //                 ref={provided.innerRef}
  //                 {...provided.droppableProps}
  //                 className="todo-list"
  //               >
  //                                  {" "}
  //                 <h2 className="text-xl font-bold mb-2">{list.name}</h2>
  //                                  {" "}
  //                 <AddTaskForm listId={list.id} addTask={addTask} />
  //                      {" "}
  //                 {(tasksMap[list.id] || []).map((task, index) => (
  //                   <Draggable
  //                     key={task.id}
  //                     draggableId={task.id}
  //                     index={index}
  //                   >
  //                                          {" "}
  //                     {(provided) => (
  //                       <li
  //                         ref={provided.innerRef}
  //                         {...provided.draggableProps}
  //                         {...provided.dragHandleProps}
  //                         className={`todo-task ${
  //                           task.completed ? "completed" : ""
  //                         }`}
  //                       >
  //                                                  {" "}
  //                         <div>
  //                                                      {" "}
  //                           <h3 className="font-semibold">{task.title}</h3>
  //                                                {" "}
  //                           <p className="text-sm text-gray-600">
  //                                                           {task.description}
  //                                                      {" "}
  //                           </p>
  //                                                      {" "}
  //                           <p className="text-sm">
  //                                                           Due:{" "}
  //                             {task.dueDate || "No date"} | Priority:
  //                                                {" "}
  //                             <span
  //                               className={
  //                                 task.priority === "High"
  //                                   ? "text-red-500"
  //                                   : task.priority === "Medium"
  //                                   ? "text-yellow-500"
  //                                   : "text-green-500"
  //                               }
  //                             >
  //                                                               {task.priority}
  //                                                          {" "}
  //                             </span>
  //                                                        {" "}
  //                           </p>
  //                                                    {" "}
  //                         </div>
  //                                                  {" "}
  //                         <div className="flex gap-2">
  //                                                      {" "}
  //                           <button
  //                             onClick={() =>
  //                               toggleComplete(list.id, task.id, task.completed)
  //                             }
  //                             className="btn btn-primary text-sm"
  //                           >
  //                                                          {" "}
  //                             {task.completed ? "Undo" : "Done"}
  //                                        {" "}
  //                           </button>
  //                                                      {" "}
  //                           <button
  //                             onClick={() => deleteTask(list.id, task.id)}
  //                             className="btn btn-danger text-sm"
  //                           >
  //                                                           Delete
  //                                          {" "}
  //                           </button>
  //                                                    {" "}
  //                         </div>
  //                                                {" "}
  //                       </li>
  //                     )}
  //                                        {" "}
  //                   </Draggable>
  //                 ))}
  //                                   {provided.placeholder}               {" "}
  //               </div>
  //             )}
  //                        {" "}
  //           </Droppable>
  //         ))}
  //                {" "}
  //       </div>
  //            {" "}
  //     </DragDropContext>
  //        {" "}
  //   </div>
  // );
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="dashboard-title">Your To Do Lists 📝</span>
        <button
          onClick={handleLogout}
          className="dashboard-logout btn btn-danger"
        >
          Logout
        </button>
      </div>

      <form onSubmit={addList} className="dashboard-form">
        <input
          type="text"
          placeholder="Enter new list name"
          className="input"
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
        />
        <button className="btn btn-primary">Add List</button>
      </form>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="dashboard-grid">
          {lists.map((list) => (
            <Droppable key={list.id} droppableId={list.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="todo-list"
                >
                  <h2 className="todo-list-title">{list.name}</h2>
                  <AddTaskForm listId={list.id} addTask={addTask} />
                  {(tasksMap[list.id] || []).map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`todo-task${
                            task.completed ? " completed" : ""
                          }`}
                        >
                          <div>
                            <h3 className="todo-task-title">{task.title}</h3>
                            <p className="todo-task-desc">{task.description}</p>
                            <p className="todo-task-meta">
                              Due: {task.dueDate || "No date"} | Priority:{" "}
                              <span
                                className={
                                  task.priority === "High"
                                    ? "priority priority-high"
                                    : task.priority === "Medium"
                                    ? "priority priority-medium"
                                    : "priority priority-low"
                                }
                              >
                                {task.priority}
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                toggleComplete(list.id, task.id, task.completed)
                              }
                              className="btn btn-primary text-sm"
                            >
                              {task.completed ? "Undo" : "Done"}
                            </button>
                            <button
                              onClick={() => deleteTask(list.id, task.id)}
                              className="btn btn-danger text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
function AddTaskForm({ listId, addTask }) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Low");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addTask(listId, {
      title: taskTitle,
      description: taskDesc,
      dueDate: taskDate,
      priority: taskPriority,
    });
    setTaskTitle("");
    setTaskDesc("");
    setTaskDate("");
    setTaskPriority("Low");
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-3">
           {" "}
      <input
        type="text"
        placeholder="Task title"
        className="input"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
      />
           {" "}
      <textarea
        placeholder="Description"
        className="input"
        value={taskDesc}
        onChange={(e) => setTaskDesc(e.target.value)}
      />
           {" "}
      <input
        type="date"
        className="input"
        value={taskDate}
        onChange={(e) => setTaskDate(e.target.value)}
      />
           {" "}
      <select
        className="input"
        value={taskPriority}
        onChange={(e) => setTaskPriority(e.target.value)}
      >
                <option>Low</option>        <option>Medium</option>       {" "}
        <option>High</option>     {" "}
      </select>
            <button className="btn btn-success">Add Task</button>   {" "}
    </form>
  );
}
