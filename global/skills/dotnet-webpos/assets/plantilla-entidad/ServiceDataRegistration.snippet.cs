// FRAGMENTO, no es un archivo compilable por sí solo.
// 02-WPApiPortalFeEc.Services/WPApiPortalFeEc.Services.Data/ServiceDataRegistration.cs
// Añadir el using arriba y la línea dentro de AddServicesData(), junto a los demás servicios de catálogo.
// Nunca registres servicios en Program.cs: AddServicesData() lo llaman todos los hosts.

using WPApiPortalFeEc.Common.Dto.Item;

services.AddScoped<IItemService<Item, int, ItemDto, CreateItemDto, UpdateItemDto>, ItemService>();

// Si el servicio solo usara el CRUD base (sin IItemService):
// services.AddScoped<ICrudService<Item, int, ItemDto, CreateItemDto, UpdateItemDto>, ItemService>();
