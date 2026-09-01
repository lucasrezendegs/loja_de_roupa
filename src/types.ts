export type Clothing = {
  id: string
  name: string
  category: string
  size: string | null
  color: string | null
  brand: string | null
  season: string | null
  image_url: string | null
  notes: string | null
  created_at: string
}

export const categories = ['Camisetas', 'Camisas', 'Calças', 'Bermudas', 'Jaquetas', 'Moletons', 'Tênis', 'Sapatos', 'Acessórios', 'Outros']
export const seasons = ['Todas', 'Verão', 'Inverno', 'Meia-estação']
