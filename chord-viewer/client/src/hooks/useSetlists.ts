import { useState, useEffect } from "react";
import { Setlist } from "../types";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "../lib/firebase"; // Importa a conexão que criamos

export function useSetlists() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Referência à coleção "setlists" no banco de dados
    const q = query(collection(db, "setlists"), orderBy("name"));

    // onSnapshot: OUVINTE em tempo real.
    // Sempre que algo mudar no servidor, essa função roda sozinha.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id, // Garante que o ID venha do documento
      })) as Setlist[];
      
      setSetlists(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro no Firebase:", error);
      setLoading(false);
    });

    // Limpa o ouvinte quando sair da tela
    return () => unsubscribe();
  }, []);

  const createSetlist = async (name: string) => {
    const id = crypto.randomUUID();
    const newSetlist: Setlist = {
      id,
      name,
      songs: [],
    };
    // Salva no Firestore (coleção 'setlists', documento com ID gerado)
    await setDoc(doc(db, "setlists", id), newSetlist);
  };

  const deleteSetlist = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este repertório?")) {
      await deleteDoc(doc(db, "setlists", id));
    }
  };

  const addToSetlist = async (setlistId: string, songPath: string) => {
    // 1. Acha a lista atual na memória para pegar as músicas antigas
    const currentList = setlists.find(s => s.id === setlistId);
    if (!currentList) return;

    // 2. Evita duplicatas
    if (currentList.songs.includes(songPath)) return;

    // 3. Atualiza no Firebase
    const updatedSongs = [...currentList.songs, songPath];
    await setDoc(doc(db, "setlists", setlistId), { 
      ...currentList, 
      songs: updatedSongs 
    });
  };

  const removeFromSetlist = async (setlistId: string, songPath: string) => {
    const currentList = setlists.find(s => s.id === setlistId);
    if (!currentList) return;

    const updatedSongs = currentList.songs.filter(p => p !== songPath);
    await setDoc(doc(db, "setlists", setlistId), { 
      ...currentList, 
      songs: updatedSongs 
    });
  };

  return {
    setlists,
    loading,
    createSetlist,
    deleteSetlist,
    addToSetlist,
    removeFromSetlist,
  };
}