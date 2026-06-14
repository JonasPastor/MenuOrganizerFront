"use client"

import { useEffect, useState } from "react"
import { Flame, Plus, Search, Trash2, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface Ingredient {
  id: string
  name: string
  unit: string
  backendId?: number
}

interface RecipeIngredient {
  ingredientId: string
  quantity: number
}

interface Recipe {
  id: string
  name: string
  description: string
  calories: number
  ingredients: RecipeIngredient[]
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [showIngredientForm, setShowIngredientForm] = useState(false)
  const [showIngredientsList, setShowIngredientsList] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false)
  const [ingredientsError, setIngredientsError] = useState<string | null>(null)
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [recipesError, setRecipesError] = useState<string | null>(null)
  
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    description: "",
    calories: "",
  })
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>([])
  
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    unit: "g",
  })

  useEffect(() => {
    const loadIngredients = async () => {
      setIsLoadingIngredients(true)
      setIngredientsError(null)

      try {
        const token = localStorage.getItem("authToken")
        const response = await fetch(`${API_BASE_URL}/ingrediente`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || "Failed to load ingredients")
        }

        const data = (await response.json()) as Array<{
          id?: number | string
          ingredienteId?: number | string
          nombre?: string
          unidadbase?: string
        }>

        const normalized = data
          .filter((item) => item?.nombre)
          .map((item, index) => {
            const rawId = item.id ?? item.ingredienteId
            const parsedId = rawId !== undefined ? Number(rawId) : undefined
            return {
              id: rawId ? String(rawId) : `${item.nombre}-${index}`,
              name: item.nombre ?? "",
              unit: item.unidadbase ?? "",
              backendId: Number.isFinite(parsedId) ? parsedId : undefined,
            }
          })

        setIngredients(normalized)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load ingredients"
        setIngredientsError(message)
      } finally {
        setIsLoadingIngredients(false)
      }
    }

    loadIngredients()
  }, [])

  useEffect(() => {
    const loadMenus = async () => {
      setIsLoadingRecipes(true)
      setRecipesError(null)

      try {
        const token = localStorage.getItem("authToken")
        const response = await fetch(`${API_BASE_URL}/menu`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || "Failed to load menus")
        }

        const data = (await response.json()) as Array<{
          nombre?: string
          descripcion?: string
          calorias?: number | string
        }>

        const normalized = data
          .filter((item) => item?.nombre)
          .map((item, index) => ({
            id: `${item.nombre}-${index}`,
            name: item.nombre ?? "",
            description: item.descripcion ?? "",
            calories: Number(item.calorias) || 0,
            ingredients: [],
          }))

        setRecipes(normalized)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load menus"
        setRecipesError(message)
      } finally {
        setIsLoadingRecipes(false)
      }
    }

    loadMenus()
  }, [])

  const getIngredientById = (id: string) => ingredients.find((i) => i.id === id)

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddIngredient = async () => {
    if (!newIngredient.name || !newIngredient.unit) return

    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${API_BASE_URL}/ingrediente`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre: newIngredient.name,
          unidadbase: newIngredient.unit,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to create ingredient")
      }

        const data = (await response.json()) as {
          id?: number | string
          ingredienteId?: number | string
          nombre?: string
          unidadbase?: string
        }
        const rawId = data.id ?? data.ingredienteId
        const parsedId = rawId !== undefined ? Number(rawId) : undefined
      const ingredient: Ingredient = {
        id: rawId ? String(rawId) : `${data?.nombre ?? newIngredient.name}-${Date.now()}`,
        name: data?.nombre ?? newIngredient.name,
        unit: data?.unidadbase ?? newIngredient.unit,
        backendId: Number.isFinite(parsedId) ? parsedId : undefined,
      }

      setIngredients((prev) => [...prev, ingredient])
      setNewIngredient({ name: "", unit: "g" })
      setShowIngredientForm(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create ingredient"
      setIngredientsError(message)
    }
  }

  const handleDeleteIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id))
  }

  const handleAddRecipe = async () => {
    if (!newRecipe.name || !newRecipe.calories) return

    try {
      const token = localStorage.getItem("authToken")
      const menuResponse = await fetch(`${API_BASE_URL}/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombre: newRecipe.name,
          descripcion: newRecipe.description,
          calorias: Number(newRecipe.calories) || 0,
        }),
      })

      if (!menuResponse.ok) {
        const text = await menuResponse.text()
        throw new Error(text || "Failed to create menu")
      }

      const menuData = (await menuResponse.json().catch(() => ({}))) as {
        id?: string
        menuId?: string
        nombre?: string
        descripcion?: string
        calorias?: number | string
      }

      const menuId = menuData.id ?? menuData.menuId
      if (!menuId) {
        throw new Error("Menu created but no menuId returned")
      }

      if (selectedIngredients.length > 0) {
        const items = selectedIngredients
          .map((item) => {
            const ingredient = ingredients.find((i) => i.id === item.ingredientId)
            if (!ingredient?.backendId) return null
            return {
              ingredienteId: ingredient.backendId,
              cantidadNecesaria: item.quantity,
              unidad: ingredient.unit,
            }
          })
          .filter(Boolean)

        if (items.length !== selectedIngredients.length) {
          throw new Error("Some ingredients are missing backend ids")
        }

        const relationResponse = await fetch(`${API_BASE_URL}/menuXingrediente`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            menuId,
            ingredientes: items,
          }),
        })

        if (!relationResponse.ok) {
          const text = await relationResponse.text()
          throw new Error(text || "Failed to link ingredients")
        }
      }

      const recipe: Recipe = {
        id: String(menuId),
        name: menuData.nombre ?? newRecipe.name,
        description: menuData.descripcion ?? newRecipe.description,
        calories: Number(menuData.calorias) || Number(newRecipe.calories) || 0,
        ingredients: selectedIngredients,
      }

      setRecipes((prev) => [recipe, ...prev])
      setNewRecipe({ name: "", description: "", calories: "" })
      setSelectedIngredients([])
      setShowRecipeForm(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create menu"
      setRecipesError(message)
    }
  }

  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter((r) => r.id !== id))
  }

  const handleAddIngredientToRecipe = (ingredientId: string) => {
    if (selectedIngredients.find((i) => i.ingredientId === ingredientId)) return
    setSelectedIngredients([...selectedIngredients, { ingredientId, quantity: 100 }])
  }

  const handleUpdateIngredientQuantity = (ingredientId: string, quantity: number) => {
    setSelectedIngredients(
      selectedIngredients.map((i) =>
        i.ingredientId === ingredientId ? { ...i, quantity } : i
      )
    )
  }

  const handleRemoveIngredientFromRecipe = (ingredientId: string) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i.ingredientId !== ingredientId))
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold leading-tight">Recipes</h1>
            <p className="text-xs text-muted-foreground">
              {recipes.length} recipes saved
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs"
          onClick={() => setShowRecipeForm(true)}
        >
          <Plus className="size-3.5" />
          <span>Add</span>
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Ingredients Management Section */}
          <Card className="border-border">
            <CardHeader 
              className="flex cursor-pointer flex-row items-center justify-between space-y-0 p-3"
              onClick={() => setShowIngredientsList(!showIngredientsList)}
            >
              <CardTitle className="text-sm font-semibold">
                Ingredients Library ({ingredients.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowIngredientForm(true)
                    setShowIngredientsList(true)
                  }}
                >
                  <Plus className="size-3" />
                  New
                </Button>
                {showIngredientsList ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            
            {showIngredientsList && (
              <CardContent className="space-y-3 p-3 pt-0">
                {ingredientsError && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {ingredientsError}
                  </div>
                )}
                {isLoadingIngredients && (
                  <div className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                    Loading ingredients...
                  </div>
                )}
                {/* Add Ingredient Form */}
                {showIngredientForm && (
                  <div className="rounded-lg border border-primary/50 bg-secondary/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium">Add New Ingredient</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        onClick={() => setShowIngredientForm(false)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Name (e.g., Chicken)"
                        value={newIngredient.name}
                        onChange={(e) =>
                          setNewIngredient({ ...newIngredient, name: e.target.value })
                        }
                        className="h-9 flex-1"
                      />
                      <select
                        value={newIngredient.unit}
                        onChange={(e) =>
                          setNewIngredient({ ...newIngredient, unit: e.target.value })
                        }
                        className="h-9 w-20 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="pcs">pcs</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                        <option value="cup">cup</option>
                      </select>
                      <Button
                        size="sm"
                        className="h-9"
                        onClick={handleAddIngredient}
                        disabled={!newIngredient.name}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* Ingredients List */}
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1"
                    >
                      <span className="text-xs">{ingredient.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({ingredient.unit})
                      </span>
                      <button
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        className="ml-1 text-muted-foreground active:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>

          {recipesError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {recipesError}
            </div>
          )}
          {isLoadingRecipes && (
            <div className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
              Loading menus...
            </div>
          )}

          {/* Add Recipe Form */}
          {showRecipeForm && (
            <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                <CardTitle className="text-sm font-semibold">New Recipe</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => {
                    setShowRecipeForm(false)
                    setSelectedIngredients([])
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Recipe Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Avocado Toast"
                    value={newRecipe.name}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, name: e.target.value })
                    }
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the recipe..."
                    value={newRecipe.description}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, description: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="calories" className="text-xs">
                    Calories (kcal) *
                  </Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="e.g., 350"
                    value={newRecipe.calories}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, calories: e.target.value })
                    }
                    className="h-10"
                  />
                </div>

                {/* Ingredient Selection */}
                <div className="space-y-2">
                  <Label className="text-xs">Ingredients</Label>
                  
                  {/* Selected Ingredients */}
                  {selectedIngredients.length > 0 && (
                    <div className="space-y-2 rounded-lg bg-secondary/30 p-2">
                      {selectedIngredients.map((ri) => {
                        const ingredient = getIngredientById(ri.ingredientId)
                        if (!ingredient) return null
                        return (
                          <div
                            key={ri.ingredientId}
                            className="flex items-center gap-2"
                          >
                            <span className="flex-1 truncate text-xs">
                              {ingredient.name}
                            </span>
                            <Input
                              type="number"
                              value={ri.quantity}
                              onChange={(e) =>
                                handleUpdateIngredientQuantity(
                                  ri.ingredientId,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="h-8 w-20 text-xs"
                            />
                            <span className="w-8 text-[10px] text-muted-foreground">
                              {ingredient.unit}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() =>
                                handleRemoveIngredientFromRecipe(ri.ingredientId)
                              }
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Available Ingredients to Add */}
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients
                      .filter(
                        (i) =>
                          !selectedIngredients.find((si) => si.ingredientId === i.id)
                      )
                      .map((ingredient) => (
                        <button
                          key={ingredient.id}
                          onClick={() => handleAddIngredientToRecipe(ingredient.id)}
                          className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs active:bg-primary active:text-primary-foreground"
                        >
                          <Plus className="size-3" />
                          {ingredient.name}
                        </button>
                      ))}
                  </div>
                  {ingredients.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No ingredients available. Add some in the Ingredients Library above.
                    </p>
                  )}
                </div>

                <Button
                  className="h-10 w-full"
                  onClick={handleAddRecipe}
                  disabled={!newRecipe.name || !newRecipe.calories}
                >
                  Save Recipe
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recipe List */}
          <div className="space-y-3">
            {filteredRecipes.length === 0 ? (
              <Card className="border-border">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No recipes found matching your search"
                      : "No recipes yet. Add your first recipe!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="border-border">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold">
                            {recipe.name}
                          </h3>
                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                            <Flame className="size-3 text-primary" />
                            <span className="text-[10px] font-medium text-primary">
                              {recipe.calories} kcal
                            </span>
                          </div>
                        </div>
                        {recipe.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {recipe.description}
                          </p>
                        )}
                        {recipe.ingredients.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {recipe.ingredients.slice(0, 4).map((ri) => {
                              const ingredient = getIngredientById(ri.ingredientId)
                              if (!ingredient) return null
                              return (
                                <span
                                  key={ri.ingredientId}
                                  className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                                >
                                  {ri.quantity}{ingredient.unit} {ingredient.name}
                                </span>
                              )
                            })}
                            {recipe.ingredients.length > 4 && (
                              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                +{recipe.ingredients.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground active:text-destructive"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
