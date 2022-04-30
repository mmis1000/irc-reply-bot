virtual_class = (classes...)->
  MixinClass = () ->
    for Clazz from classes
      try
        Clazz.apply @, arguments
    @

  for Clazz from classes
    for own key of Clazz::
      if Clazz::[key] isnt Clazz
        MixinClass::[key] = Clazz::[key]
    for own key of Clazz
      if Clazz[key] isnt Object.getPrototypeOf(Clazz::)
        MixinClass[key] = Clazz[key]

  MixinClass

module.exports = virtual_class