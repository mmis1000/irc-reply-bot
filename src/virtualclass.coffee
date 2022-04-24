virtual_class = (classes...)->
  MixinClass = () ->
    for Clazz in classes
      try
        Clazz.apply @, arguments
    @

  for Clazz in classes
    for own key of Clazz::
      if Clazz::[key] isnt Clazz
        MixinClass::[key] = Clazz::[key]
    for own key of Clazz
      if Clazz[key] isnt Object.getPrototypeOf(Clazz::)
        MixinClass[key] = Clazz[key]

  MixinClass

module.exports = virtual_class