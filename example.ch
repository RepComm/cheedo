# cheedo

# declare boo[lean]
b is false

# declare num[ber]
n is 5

# declare arr[ay]
a is 1,2,3

# declare str[ing]
s is "hello world"

# declare obj[ect]
o is { key is "value", name is "thing", other is "etc" }

# standard output
log o as str

log b as str

log n as str

# coerce a tuple of values to array of string
log b, n, a, s, o as arr of str

# conditionals
if password is "secret text"
 log "login success"
end

# callables - declare your types first
## str, str => none
greet is name, message =>
 if name is none
  log "you don't have a name?.."
  ret
 end
 log name, "says", message
end

greet "Jon", "Hi Mom"

enum possibilities
 one_hand is "example"
 other_hand is => ret "calculation"
end

# only have to say what enum it came from the first time
possibility is one_hand of possibilities

if random of math is atleast 0.5
 possibility is other_hand
end

log possibility as string


