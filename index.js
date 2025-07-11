// src/binary_reader.ts
var BinaryReader = class {
  #buffer;
  #offset = 0;
  constructor(input) {
    this.#buffer = new DataView(input.buffer);
    this.#offset = input.byteOffset;
  }
  get offset() {
    return this.#offset;
  }
  readUInt8Array() {
    const length = this.readU32();
    const value = new Uint8Array(
      this.#buffer.buffer,
      this.#offset,
      length
    );
    this.#offset += length;
    return value;
  }
  readBool() {
    const value = this.#buffer.getUint8(this.#offset);
    this.#offset += 1;
    return value !== 0;
  }
  readByte() {
    const value = this.#buffer.getUint8(this.#offset);
    this.#offset += 1;
    return value;
  }
  readBytes(length) {
    const value = new DataView(
      this.#buffer.buffer,
      this.#offset,
      length
    );
    this.#offset += length;
    return new Uint8Array(value.buffer);
  }
  readI8() {
    const value = this.#buffer.getInt8(this.#offset);
    this.#offset += 1;
    return value;
  }
  readU8() {
    const value = this.#buffer.getUint8(this.#offset);
    this.#offset += 1;
    return value;
  }
  readI16() {
    const value = this.#buffer.getInt16(this.#offset, true);
    this.#offset += 2;
    return value;
  }
  readU16() {
    const value = this.#buffer.getUint16(this.#offset, true);
    this.#offset += 2;
    return value;
  }
  readI32() {
    const value = this.#buffer.getInt32(this.#offset, true);
    this.#offset += 4;
    return value;
  }
  readU32() {
    const value = this.#buffer.getUint32(this.#offset, true);
    this.#offset += 4;
    return value;
  }
  readI64() {
    const value = this.#buffer.getBigInt64(this.#offset, true);
    this.#offset += 8;
    return value;
  }
  readU64() {
    const value = this.#buffer.getBigUint64(this.#offset, true);
    this.#offset += 8;
    return value;
  }
  readU128() {
    const lowerPart = this.#buffer.getBigUint64(this.#offset, true);
    const upperPart = this.#buffer.getBigUint64(this.#offset + 8, true);
    this.#offset += 16;
    return (upperPart << BigInt(64)) + lowerPart;
  }
  readI128() {
    const lowerPart = this.#buffer.getBigUint64(this.#offset, true);
    const upperPart = this.#buffer.getBigInt64(this.#offset + 8, true);
    this.#offset += 16;
    return (upperPart << BigInt(64)) + lowerPart;
  }
  readU256() {
    const p0 = this.#buffer.getBigUint64(this.#offset, true);
    const p1 = this.#buffer.getBigUint64(this.#offset + 8, true);
    const p2 = this.#buffer.getBigUint64(this.#offset + 16, true);
    const p3 = this.#buffer.getBigUint64(this.#offset + 24, true);
    this.#offset += 32;
    return (p3 << BigInt(3 * 64)) + (p2 << BigInt(2 * 64)) + (p1 << BigInt(1 * 64)) + p0;
  }
  readI256() {
    const p0 = this.#buffer.getBigUint64(this.#offset, true);
    const p1 = this.#buffer.getBigUint64(this.#offset + 8, true);
    const p2 = this.#buffer.getBigUint64(this.#offset + 16, true);
    const p3 = this.#buffer.getBigInt64(this.#offset + 24, true);
    this.#offset += 32;
    return (p3 << BigInt(3 * 64)) + (p2 << BigInt(2 * 64)) + (p1 << BigInt(1 * 64)) + p0;
  }
  readF32() {
    const value = this.#buffer.getFloat32(this.#offset, true);
    this.#offset += 4;
    return value;
  }
  readF64() {
    const value = this.#buffer.getFloat64(this.#offset, true);
    this.#offset += 8;
    return value;
  }
  readString() {
    const length = this.readU32();
    const uint8Array = new Uint8Array(
      this.#buffer.buffer,
      this.#offset,
      length
    );
    const decoder = new TextDecoder("utf-8");
    const value = decoder.decode(uint8Array);
    this.#offset += length;
    return value;
  }
};

// src/binary_writer.ts
var BinaryWriter = class {
  #buffer;
  #view;
  #offset = 0;
  constructor(size) {
    this.#buffer = new Uint8Array(size);
    this.#view = new DataView(this.#buffer.buffer);
  }
  #expandBuffer(additionalCapacity) {
    const minCapacity = this.#offset + additionalCapacity + 1;
    if (minCapacity <= this.#buffer.length) return;
    let newCapacity = this.#buffer.length * 2;
    if (newCapacity < minCapacity) newCapacity = minCapacity;
    const newBuffer = new Uint8Array(newCapacity);
    newBuffer.set(this.#buffer);
    this.#buffer = newBuffer;
    this.#view = new DataView(this.#buffer.buffer);
  }
  getBuffer() {
    return this.#buffer.slice(0, this.#offset);
  }
  writeUInt8Array(value) {
    const length = value.length;
    this.#expandBuffer(4 + length);
    this.writeU32(length);
    this.#buffer.set(value, this.#offset);
    this.#offset += value.length;
  }
  writeBool(value) {
    this.#expandBuffer(1);
    this.#view.setUint8(this.#offset, value ? 1 : 0);
    this.#offset += 1;
  }
  writeByte(value) {
    this.#expandBuffer(1);
    this.#view.setUint8(this.#offset, value);
    this.#offset += 1;
  }
  writeI8(value) {
    this.#expandBuffer(1);
    this.#view.setInt8(this.#offset, value);
    this.#offset += 1;
  }
  writeU8(value) {
    this.#expandBuffer(1);
    this.#view.setUint8(this.#offset, value);
    this.#offset += 1;
  }
  writeI16(value) {
    this.#expandBuffer(2);
    this.#view.setInt16(this.#offset, value, true);
    this.#offset += 2;
  }
  writeU16(value) {
    this.#expandBuffer(2);
    this.#view.setUint16(this.#offset, value, true);
    this.#offset += 2;
  }
  writeI32(value) {
    this.#expandBuffer(4);
    this.#view.setInt32(this.#offset, value, true);
    this.#offset += 4;
  }
  writeU32(value) {
    this.#expandBuffer(4);
    this.#view.setUint32(this.#offset, value, true);
    this.#offset += 4;
  }
  writeI64(value) {
    this.#expandBuffer(8);
    this.#view.setBigInt64(this.#offset, value, true);
    this.#offset += 8;
  }
  writeU64(value) {
    this.#expandBuffer(8);
    this.#view.setBigUint64(this.#offset, value, true);
    this.#offset += 8;
  }
  writeU128(value) {
    this.#expandBuffer(16);
    const lowerPart = value & BigInt("0xFFFFFFFFFFFFFFFF");
    const upperPart = value >> BigInt(64);
    this.#view.setBigUint64(this.#offset, lowerPart, true);
    this.#view.setBigUint64(this.#offset + 8, upperPart, true);
    this.#offset += 16;
  }
  writeI128(value) {
    this.#expandBuffer(16);
    const lowerPart = value & BigInt("0xFFFFFFFFFFFFFFFF");
    const upperPart = value >> BigInt(64);
    this.#view.setBigInt64(this.#offset, lowerPart, true);
    this.#view.setBigInt64(this.#offset + 8, upperPart, true);
    this.#offset += 16;
  }
  writeU256(value) {
    this.#expandBuffer(32);
    const low_64_mask = BigInt("0xFFFFFFFFFFFFFFFF");
    const p0 = value & low_64_mask;
    const p1 = value >> BigInt(64 * 1) & low_64_mask;
    const p2 = value >> BigInt(64 * 2) & low_64_mask;
    const p3 = value >> BigInt(64 * 3);
    this.#view.setBigUint64(this.#offset + 8 * 0, p0, true);
    this.#view.setBigUint64(this.#offset + 8 * 1, p1, true);
    this.#view.setBigUint64(this.#offset + 8 * 2, p2, true);
    this.#view.setBigUint64(this.#offset + 8 * 3, p3, true);
    this.#offset += 32;
  }
  writeI256(value) {
    this.#expandBuffer(32);
    const low_64_mask = BigInt("0xFFFFFFFFFFFFFFFF");
    const p0 = value & low_64_mask;
    const p1 = value >> BigInt(64 * 1) & low_64_mask;
    const p2 = value >> BigInt(64 * 2) & low_64_mask;
    const p3 = value >> BigInt(64 * 3);
    this.#view.setBigUint64(this.#offset + 8 * 0, p0, true);
    this.#view.setBigUint64(this.#offset + 8 * 1, p1, true);
    this.#view.setBigUint64(this.#offset + 8 * 2, p2, true);
    this.#view.setBigInt64(this.#offset + 8 * 3, p3, true);
    this.#offset += 32;
  }
  writeF32(value) {
    this.#expandBuffer(4);
    this.#view.setFloat32(this.#offset, value, true);
    this.#offset += 4;
  }
  writeF64(value) {
    this.#expandBuffer(8);
    this.#view.setFloat64(this.#offset, value, true);
    this.#offset += 8;
  }
  writeString(value) {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(value);
    this.writeU32(encodedString.length);
    this.#expandBuffer(encodedString.length);
    this.#buffer.set(encodedString, this.#offset);
    this.#offset += encodedString.length;
  }
};

// src/utils.ts
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}
function uint8ArrayToHexString(array) {
  return Array.prototype.map.call(array.reverse(), (x) => ("00" + x.toString(16)).slice(-2)).join("");
}
function uint8ArrayToU128(array) {
  if (array.length != 16) {
    throw new Error(`Uint8Array is not 16 bytes long: ${array}`);
  }
  return new BinaryReader(array).readU128();
}
function uint8ArrayToU256(array) {
  if (array.length != 32) {
    throw new Error(`Uint8Array is not 32 bytes long: [${array}]`);
  }
  return new BinaryReader(array).readU256();
}
function hexStringToUint8Array(str) {
  if (str.startsWith("0x")) {
    str = str.slice(2);
  }
  let matches = str.match(/.{1,2}/g) || [];
  let data = Uint8Array.from(matches.map((byte) => parseInt(byte, 16)));
  if (data.length != 32) {
    return new Uint8Array(0);
  }
  return data.reverse();
}
function hexStringToU128(str) {
  return uint8ArrayToU128(hexStringToUint8Array(str));
}
function hexStringToU256(str) {
  return uint8ArrayToU256(hexStringToUint8Array(str));
}
function u128ToUint8Array(data) {
  let writer = new BinaryWriter(16);
  writer.writeU128(data);
  return writer.getBuffer();
}
function u128ToHexString(data) {
  return uint8ArrayToHexString(u128ToUint8Array(data));
}
function u256ToUint8Array(data) {
  let writer = new BinaryWriter(32);
  writer.writeU256(data);
  return writer.getBuffer();
}
function u256ToHexString(data) {
  return uint8ArrayToHexString(u256ToUint8Array(data));
}

// src/connection_id.ts
var ConnectionId = class _ConnectionId {
  data;
  get __connection_id__() {
    return this.data;
  }
  /**
   * Creates a new `ConnectionId`.
   */
  constructor(data) {
    this.data = data;
  }
  isZero() {
    return this.data === BigInt(0);
  }
  static nullIfZero(addr) {
    if (addr.isZero()) {
      return null;
    } else {
      return addr;
    }
  }
  static random() {
    function randomU8() {
      return Math.floor(Math.random() * 255);
    }
    let result = BigInt(0);
    for (let i = 0; i < 16; i++) {
      result = result << BigInt(8) | BigInt(randomU8());
    }
    return new _ConnectionId(result);
  }
  /**
   * Compare two connection IDs for equality.
   */
  isEqual(other) {
    return this.data == other.data;
  }
  /**
   * Print the connection ID as a hexadecimal string.
   */
  toHexString() {
    return u128ToHexString(this.data);
  }
  /**
   * Convert the connection ID to a Uint8Array.
   */
  toUint8Array() {
    return u128ToUint8Array(this.data);
  }
  /**
   * Parse a connection ID from a hexadecimal string.
   */
  static fromString(str) {
    return new _ConnectionId(hexStringToU128(str));
  }
  static fromStringOrNull(str) {
    let addr = _ConnectionId.fromString(str);
    if (addr.isZero()) {
      return null;
    } else {
      return addr;
    }
  }
};

// src/time_duration.ts
var TimeDuration = class _TimeDuration {
  __time_duration_micros__;
  static MICROS_PER_MILLIS = 1000n;
  get micros() {
    return this.__time_duration_micros__;
  }
  get millis() {
    return Number(this.micros / _TimeDuration.MICROS_PER_MILLIS);
  }
  constructor(micros) {
    this.__time_duration_micros__ = micros;
  }
  static fromMillis(millis) {
    return new _TimeDuration(BigInt(millis) * _TimeDuration.MICROS_PER_MILLIS);
  }
};

// src/timestamp.ts
var Timestamp = class _Timestamp {
  __timestamp_micros_since_unix_epoch__;
  static MICROS_PER_MILLIS = 1000n;
  get microsSinceUnixEpoch() {
    return this.__timestamp_micros_since_unix_epoch__;
  }
  constructor(micros) {
    this.__timestamp_micros_since_unix_epoch__ = micros;
  }
  /**
   * The Unix epoch, the midnight at the beginning of January 1, 1970, UTC.
   */
  static UNIX_EPOCH = new _Timestamp(0n);
  /**
   * Get a `Timestamp` representing the execution environment's belief of the current moment in time.
   */
  static now() {
    return _Timestamp.fromDate(/* @__PURE__ */ new Date());
  }
  /**
   * Get a `Timestamp` representing the same point in time as `date`.
   */
  static fromDate(date) {
    const millis = date.getTime();
    const micros = BigInt(millis) * _Timestamp.MICROS_PER_MILLIS;
    return new _Timestamp(micros);
  }
  /**
   * Get a `Date` representing approximately the same point in time as `this`.
   *
   * This method truncates to millisecond precision,
   * and throws `RangeError` if the `Timestamp` is outside the range representable as a `Date`.
   */
  toDate() {
    const micros = this.__timestamp_micros_since_unix_epoch__;
    const millis = micros / _Timestamp.MICROS_PER_MILLIS;
    if (millis > BigInt(Number.MAX_SAFE_INTEGER) || millis < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw new RangeError(
        "Timestamp is outside of the representable range of JS's Date"
      );
    }
    return new Date(Number(millis));
  }
};

// src/identity.ts
var Identity = class _Identity {
  data;
  get __identity__() {
    return this.data;
  }
  /**
   * Creates a new `Identity`.
   *
   * `data` can be a hexadecimal string or a `bigint`.
   */
  constructor(data) {
    this.data = typeof data === "string" ? hexStringToU256(data) : data;
  }
  /**
   * Compare two identities for equality.
   */
  isEqual(other) {
    return this.toHexString() === other.toHexString();
  }
  /**
   * Print the identity as a hexadecimal string.
   */
  toHexString() {
    return u256ToHexString(this.data);
  }
  /**
   * Convert the address to a Uint8Array.
   */
  toUint8Array() {
    return u256ToUint8Array(this.data);
  }
  /**
   * Parse an Identity from a hexadecimal string.
   */
  static fromString(str) {
    return new _Identity(str);
  }
};

// src/schedule_at.ts
var ScheduleAt;
((ScheduleAt2) => {
  function getAlgebraicType() {
    return AlgebraicType.createSumType([
      new SumTypeVariant("Interval", AlgebraicType.createU64Type()),
      new SumTypeVariant("Time", AlgebraicType.createU64Type())
    ]);
  }
  ScheduleAt2.getAlgebraicType = getAlgebraicType;
  function serialize(value) {
    switch (value.tag) {
      case "Interval":
        return { Interval: value.value };
      case "Time":
        return { Time: value.value };
      default:
        throw "unreachable";
    }
  }
  ScheduleAt2.serialize = serialize;
  ScheduleAt2.Interval = (value) => ({
    tag: "Interval",
    value
  });
  ScheduleAt2.Time = (value) => ({ tag: "Time", value });
  function fromValue(value) {
    let sumValue = value.asSumValue();
    switch (sumValue.tag) {
      case 0:
        return { tag: "Interval", value: sumValue.value.asBigInt() };
      case 1:
        return { tag: "Time", value: sumValue.value.asBigInt() };
      default:
        throw "unreachable";
    }
  }
  ScheduleAt2.fromValue = fromValue;
})(ScheduleAt || (ScheduleAt = {}));
var schedule_at_default = ScheduleAt;

// src/algebraic_type.ts
var SumTypeVariant = class {
  name;
  algebraicType;
  constructor(name, algebraicType) {
    this.name = name;
    this.algebraicType = algebraicType;
  }
};
var SumType = class {
  variants;
  constructor(variants) {
    this.variants = variants;
  }
  serialize = (writer, value) => {
    if (this.variants.length == 2 && this.variants[0].name === "some" && this.variants[1].name === "none") {
      if (value) {
        writer.writeByte(0);
        this.variants[0].algebraicType.serialize(writer, value);
      } else {
        writer.writeByte(1);
      }
    } else {
      let variant = value["tag"];
      const index = this.variants.findIndex((v) => v.name === variant);
      if (index < 0) {
        throw `Can't serialize a sum type, couldn't find ${value.tag} tag`;
      }
      writer.writeU8(index);
      this.variants[index].algebraicType.serialize(writer, value["value"]);
    }
  };
  deserialize = (reader) => {
    let tag = reader.readU8();
    if (this.variants.length == 2 && this.variants[0].name === "some" && this.variants[1].name === "none") {
      if (tag === 0) {
        return this.variants[0].algebraicType.deserialize(reader);
      } else if (tag === 1) {
        return void 0;
      } else {
        throw `Can't deserialize an option type, couldn't find ${tag} tag`;
      }
    } else {
      let variant = this.variants[tag];
      let value = variant.algebraicType.deserialize(reader);
      return { tag: variant.name, value };
    }
  };
};
var ProductTypeElement = class {
  name;
  algebraicType;
  constructor(name, algebraicType) {
    this.name = name;
    this.algebraicType = algebraicType;
  }
};
var ProductType = class {
  elements;
  constructor(elements) {
    this.elements = elements;
  }
  isEmpty() {
    return this.elements.length === 0;
  }
  serialize = (writer, value) => {
    for (let element of this.elements) {
      element.algebraicType.serialize(writer, value[element.name]);
    }
  };
  deserialize = (reader) => {
    let result = {};
    if (this.elements.length === 1) {
      if (this.elements[0].name === "__time_duration_micros__") {
        return new TimeDuration(reader.readI64());
      }
      if (this.elements[0].name === "__timestamp_micros_since_unix_epoch__") {
        return new Timestamp(reader.readI64());
      }
      if (this.elements[0].name === "__identity__") {
        return new Identity(reader.readU256());
      }
      if (this.elements[0].name === "__connection_id__") {
        return new ConnectionId(reader.readU128());
      }
    }
    for (let element of this.elements) {
      result[element.name] = element.algebraicType.deserialize(reader);
    }
    return result;
  };
};
var MapType = class {
  keyType;
  valueType;
  constructor(keyType, valueType) {
    this.keyType = keyType;
    this.valueType = valueType;
  }
};
var AlgebraicType = class _AlgebraicType {
  type;
  type_;
  #setter(type, payload) {
    this.type_ = payload;
    this.type = payload === void 0 ? Type.None : type;
  }
  get product() {
    if (this.type !== Type.ProductType) {
      throw "product type was requested, but the type is not ProductType";
    }
    return this.type_;
  }
  set product(value) {
    this.#setter(Type.ProductType, value);
  }
  get sum() {
    if (this.type !== Type.SumType) {
      throw "sum type was requested, but the type is not SumType";
    }
    return this.type_;
  }
  set sum(value) {
    this.#setter(Type.SumType, value);
  }
  get array() {
    if (this.type !== Type.ArrayType) {
      throw "array type was requested, but the type is not ArrayType";
    }
    return this.type_;
  }
  set array(value) {
    this.#setter(Type.ArrayType, value);
  }
  get map() {
    if (this.type !== Type.MapType) {
      throw "map type was requested, but the type is not MapType";
    }
    return this.type_;
  }
  set map(value) {
    this.#setter(Type.MapType, value);
  }
  static #createType(type, payload) {
    let at = new _AlgebraicType();
    at.#setter(type, payload);
    return at;
  }
  static createProductType(elements) {
    return this.#createType(Type.ProductType, new ProductType(elements));
  }
  static createSumType(variants) {
    return this.#createType(Type.SumType, new SumType(variants));
  }
  static createArrayType(elementType) {
    return this.#createType(Type.ArrayType, elementType);
  }
  static createMapType(key, val) {
    return this.#createType(Type.MapType, new MapType(key, val));
  }
  static createBoolType() {
    return this.#createType(Type.Bool, null);
  }
  static createI8Type() {
    return this.#createType(Type.I8, null);
  }
  static createU8Type() {
    return this.#createType(Type.U8, null);
  }
  static createI16Type() {
    return this.#createType(Type.I16, null);
  }
  static createU16Type() {
    return this.#createType(Type.U16, null);
  }
  static createI32Type() {
    return this.#createType(Type.I32, null);
  }
  static createU32Type() {
    return this.#createType(Type.U32, null);
  }
  static createI64Type() {
    return this.#createType(Type.I64, null);
  }
  static createU64Type() {
    return this.#createType(Type.U64, null);
  }
  static createI128Type() {
    return this.#createType(Type.I128, null);
  }
  static createU128Type() {
    return this.#createType(Type.U128, null);
  }
  static createI256Type() {
    return this.#createType(Type.I256, null);
  }
  static createU256Type() {
    return this.#createType(Type.U256, null);
  }
  static createF32Type() {
    return this.#createType(Type.F32, null);
  }
  static createF64Type() {
    return this.#createType(Type.F64, null);
  }
  static createStringType() {
    return this.#createType(Type.String, null);
  }
  static createBytesType() {
    return this.createArrayType(this.createU8Type());
  }
  static createOptionType(innerType) {
    return this.createSumType([
      new SumTypeVariant("some", innerType),
      new SumTypeVariant("none", this.createProductType([]))
    ]);
  }
  static createIdentityType() {
    return this.createProductType([
      new ProductTypeElement("__identity__", this.createU256Type())
    ]);
  }
  static createConnectionIdType() {
    return this.createProductType([
      new ProductTypeElement("__connection_id__", this.createU128Type())
    ]);
  }
  static createScheduleAtType() {
    return schedule_at_default.getAlgebraicType();
  }
  static createTimestampType() {
    return this.createProductType([
      new ProductTypeElement(
        "__timestamp_micros_since_unix_epoch__",
        this.createI64Type()
      )
    ]);
  }
  static createTimeDurationType() {
    return this.createProductType([
      new ProductTypeElement("__time_duration_micros__", this.createI64Type())
    ]);
  }
  isProductType() {
    return this.type === Type.ProductType;
  }
  isSumType() {
    return this.type === Type.SumType;
  }
  isArrayType() {
    return this.type === Type.ArrayType;
  }
  isMapType() {
    return this.type === Type.MapType;
  }
  #isBytes() {
    return this.isArrayType() && this.array.type == Type.U8;
  }
  #isBytesNewtype(tag) {
    return this.isProductType() && this.product.elements.length === 1 && (this.product.elements[0].algebraicType.type == Type.U128 || this.product.elements[0].algebraicType.type == Type.U256) && this.product.elements[0].name === tag;
  }
  #isI64Newtype(tag) {
    return this.isProductType() && this.product.elements.length === 1 && this.product.elements[0].algebraicType.type === Type.I64 && this.product.elements[0].name === tag;
  }
  isIdentity() {
    return this.#isBytesNewtype("__identity__");
  }
  isConnectionId() {
    return this.#isBytesNewtype("__connection_id__");
  }
  isScheduleAt() {
    return this.isSumType() && this.sum.variants.length === 2 && this.sum.variants[0].name === "Interval" && this.sum.variants[0].algebraicType.type === Type.U64 && this.sum.variants[1].name === "Time" && this.sum.variants[1].algebraicType.type === Type.U64;
  }
  isTimestamp() {
    return this.#isI64Newtype("__timestamp_micros_since_unix_epoch__");
  }
  isTimeDuration() {
    return this.#isI64Newtype("__time_duration_micros__");
  }
  serialize(writer, value) {
    switch (this.type) {
      case Type.ProductType:
        this.product.serialize(writer, value);
        break;
      case Type.SumType:
        this.sum.serialize(writer, value);
        break;
      case Type.ArrayType:
        if (this.#isBytes()) {
          writer.writeUInt8Array(value);
        } else {
          const elemType = this.array;
          writer.writeU32(value.length);
          for (let elem of value) {
            elemType.serialize(writer, elem);
          }
        }
        break;
      case Type.MapType:
        throw new Error("not implemented");
      case Type.Bool:
        writer.writeBool(value);
        break;
      case Type.I8:
        writer.writeI8(value);
        break;
      case Type.U8:
        writer.writeU8(value);
        break;
      case Type.I16:
        writer.writeI16(value);
        break;
      case Type.U16:
        writer.writeU16(value);
        break;
      case Type.I32:
        writer.writeI32(value);
        break;
      case Type.U32:
        writer.writeU32(value);
        break;
      case Type.I64:
        writer.writeI64(value);
        break;
      case Type.U64:
        writer.writeU64(value);
        break;
      case Type.I128:
        writer.writeI128(value);
        break;
      case Type.U128:
        writer.writeU128(value);
        break;
      case Type.I256:
        writer.writeI256(value);
        break;
      case Type.U256:
        writer.writeU256(value);
        break;
      case Type.F32:
        writer.writeF32(value);
        break;
      case Type.F64:
        writer.writeF64(value);
        break;
      case Type.String:
        writer.writeString(value);
        break;
      default:
        throw new Error(`not implemented, ${this.type}`);
    }
  }
  deserialize(reader) {
    switch (this.type) {
      case Type.ProductType:
        return this.product.deserialize(reader);
      case Type.SumType:
        return this.sum.deserialize(reader);
      case Type.ArrayType:
        if (this.#isBytes()) {
          return reader.readUInt8Array();
        } else {
          const elemType = this.array;
          const length = reader.readU32();
          let result = [];
          for (let i = 0; i < length; i++) {
            result.push(elemType.deserialize(reader));
          }
          return result;
        }
      case Type.MapType:
        throw new Error("not implemented");
      case Type.Bool:
        return reader.readBool();
      case Type.I8:
        return reader.readI8();
      case Type.U8:
        return reader.readU8();
      case Type.I16:
        return reader.readI16();
      case Type.U16:
        return reader.readU16();
      case Type.I32:
        return reader.readI32();
      case Type.U32:
        return reader.readU32();
      case Type.I64:
        return reader.readI64();
      case Type.U64:
        return reader.readU64();
      case Type.I128:
        return reader.readI128();
      case Type.U128:
        return reader.readU128();
      case Type.U256:
        return reader.readU256();
      case Type.F32:
        return reader.readF32();
      case Type.F64:
        return reader.readF64();
      case Type.String:
        return reader.readString();
      default:
        throw new Error(`not implemented, ${this.type}`);
    }
  }
};
((AlgebraicType3) => {
  ((Type3) => {
    Type3["SumType"] = "SumType";
    Type3["ProductType"] = "ProductType";
    Type3["ArrayType"] = "ArrayType";
    Type3["MapType"] = "MapType";
    Type3["Bool"] = "Bool";
    Type3["I8"] = "I8";
    Type3["U8"] = "U8";
    Type3["I16"] = "I16";
    Type3["U16"] = "U16";
    Type3["I32"] = "I32";
    Type3["U32"] = "U32";
    Type3["I64"] = "I64";
    Type3["U64"] = "U64";
    Type3["I128"] = "I128";
    Type3["U128"] = "U128";
    Type3["I256"] = "I256";
    Type3["U256"] = "U256";
    Type3["F32"] = "F32";
    Type3["F64"] = "F64";
    Type3["String"] = "String";
    Type3["None"] = "None";
  })(AlgebraicType3.Type || (AlgebraicType3.Type = {}));
})(AlgebraicType || (AlgebraicType = {}));
var Type = AlgebraicType.Type;

// src/algebraic_value.ts
var SumValue = class {
  /** A tag representing the choice of one variant of the sum type's variants. */
  tag;
  /**
   * Given a variant `Var(Ty)` in a sum type `{ Var(Ty), ... }`,
   * this provides the `value` for `Ty`.
   */
  value;
  constructor(tag, value) {
    this.tag = tag;
    this.value = value;
  }
  static deserialize(type, adapter) {
    return adapter.readSum(type);
  }
};
var ProductValue = class {
  elements;
  constructor(elements) {
    this.elements = elements;
  }
  static deserialize(type, adapter) {
    return adapter.readProduct(type);
  }
};
var AlgebraicValue = class {
  value;
  constructor(value) {
    if (value === void 0) {
      throw "value is undefined";
    }
    this.value = value;
  }
  callMethod(methodName) {
    return this[methodName]();
  }
  static deserialize(type, adapter) {
    switch (type.type) {
      case AlgebraicType.Type.ProductType:
        return new this(ProductValue.deserialize(type.product, adapter));
      case AlgebraicType.Type.SumType:
        return new this(SumValue.deserialize(type.sum, adapter));
      case AlgebraicType.Type.ArrayType:
        let elemType = type.array;
        if (elemType.type === AlgebraicType.Type.U8) {
          return new this(adapter.readUInt8Array());
        } else {
          return new this(adapter.readArray(elemType));
        }
      case AlgebraicType.Type.MapType:
        let mapType = type.map;
        return new this(adapter.readMap(mapType.keyType, mapType.valueType));
      case AlgebraicType.Type.Bool:
        return new this(adapter.readBool());
      case AlgebraicType.Type.I8:
        return new this(adapter.readI8());
      case AlgebraicType.Type.U8:
        return new this(adapter.readU8());
      case AlgebraicType.Type.I16:
        return new this(adapter.readI16());
      case AlgebraicType.Type.U16:
        return new this(adapter.readU16());
      case AlgebraicType.Type.I32:
        return new this(adapter.readI32());
      case AlgebraicType.Type.U32:
        return new this(adapter.readU32());
      case AlgebraicType.Type.I64:
        return new this(adapter.readI64());
      case AlgebraicType.Type.U64:
        return new this(adapter.readU64());
      case AlgebraicType.Type.I128:
        return new this(adapter.readI128());
      case AlgebraicType.Type.U128:
        return new this(adapter.readU128());
      case AlgebraicType.Type.String:
        return new this(adapter.readString());
      default:
        throw new Error(`not implemented, ${type.type}`);
    }
  }
  // TODO: all of the following methods should actually check the type of `self.value`
  // and throw if it does not match.
  asProductValue() {
    return this.value;
  }
  asField(index) {
    return this.asProductValue().elements[index];
  }
  asSumValue() {
    return this.value;
  }
  asArray() {
    return this.value;
  }
  asMap() {
    return this.value;
  }
  asString() {
    return this.value;
  }
  asBoolean() {
    return this.value;
  }
  asNumber() {
    return this.value;
  }
  asBytes() {
    return this.value;
  }
  asBigInt() {
    return this.value;
  }
  asIdentity() {
    return new Identity(this.asField(0).asBigInt());
  }
  asConnectionId() {
    return new ConnectionId(this.asField(0).asBigInt());
  }
  asScheduleAt() {
    return ScheduleAt.fromValue(this);
  }
};
function parseValue(ty, src) {
  const reader = new BinaryReader(src);
  return ty.deserialize(reader);
}

// src/client_api/row_size_hint_type.ts
var RowSizeHint;
((RowSizeHint2) => {
  RowSizeHint2.FixedSize = (value) => ({
    tag: "FixedSize",
    value
  });
  RowSizeHint2.RowOffsets = (value) => ({
    tag: "RowOffsets",
    value
  });
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createSumType([
      new SumTypeVariant("FixedSize", AlgebraicType.createU16Type()),
      new SumTypeVariant(
        "RowOffsets",
        AlgebraicType.createArrayType(AlgebraicType.createU64Type())
      )
    ]);
  }
  RowSizeHint2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    RowSizeHint2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  RowSizeHint2.serialize = serialize;
  function deserialize(reader) {
    return RowSizeHint2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  RowSizeHint2.deserialize = deserialize;
})(RowSizeHint || (RowSizeHint = {}));

// src/client_api/bsatn_row_list_type.ts
var BsatnRowList;
((BsatnRowList2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "sizeHint",
        RowSizeHint.getTypeScriptAlgebraicType()
      ),
      new ProductTypeElement(
        "rowsData",
        AlgebraicType.createArrayType(AlgebraicType.createU8Type())
      )
    ]);
  }
  BsatnRowList2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    BsatnRowList2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  BsatnRowList2.serialize = serialize;
  function deserialize(reader) {
    return BsatnRowList2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  BsatnRowList2.deserialize = deserialize;
})(BsatnRowList || (BsatnRowList = {}));

// src/client_api/call_reducer_type.ts
var CallReducer;
((CallReducer2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("reducer", AlgebraicType.createStringType()),
      new ProductTypeElement(
        "args",
        AlgebraicType.createArrayType(AlgebraicType.createU8Type())
      ),
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement("flags", AlgebraicType.createU8Type())
    ]);
  }
  CallReducer2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    CallReducer2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  CallReducer2.serialize = serialize;
  function deserialize(reader) {
    return CallReducer2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  CallReducer2.deserialize = deserialize;
})(CallReducer || (CallReducer = {}));

// src/client_api/subscribe_type.ts
var Subscribe;
((Subscribe2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "queryStrings",
        AlgebraicType.createArrayType(AlgebraicType.createStringType())
      ),
      new ProductTypeElement("requestId", AlgebraicType.createU32Type())
    ]);
  }
  Subscribe2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    Subscribe2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  Subscribe2.serialize = serialize;
  function deserialize(reader) {
    return Subscribe2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  Subscribe2.deserialize = deserialize;
})(Subscribe || (Subscribe = {}));

// src/client_api/one_off_query_type.ts
var OneOffQuery;
((OneOffQuery2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "messageId",
        AlgebraicType.createArrayType(AlgebraicType.createU8Type())
      ),
      new ProductTypeElement("queryString", AlgebraicType.createStringType())
    ]);
  }
  OneOffQuery2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    OneOffQuery2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  OneOffQuery2.serialize = serialize;
  function deserialize(reader) {
    return OneOffQuery2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  OneOffQuery2.deserialize = deserialize;
})(OneOffQuery || (OneOffQuery = {}));

// src/client_api/query_id_type.ts
var QueryId;
((QueryId2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("id", AlgebraicType.createU32Type())
    ]);
  }
  QueryId2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    QueryId2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  QueryId2.serialize = serialize;
  function deserialize(reader) {
    return QueryId2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  QueryId2.deserialize = deserialize;
})(QueryId || (QueryId = {}));

// src/client_api/subscribe_single_type.ts
var SubscribeSingle;
((SubscribeSingle2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("query", AlgebraicType.createStringType()),
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType())
    ]);
  }
  SubscribeSingle2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    SubscribeSingle2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  SubscribeSingle2.serialize = serialize;
  function deserialize(reader) {
    return SubscribeSingle2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  SubscribeSingle2.deserialize = deserialize;
})(SubscribeSingle || (SubscribeSingle = {}));

// src/client_api/subscribe_multi_type.ts
var SubscribeMulti;
((SubscribeMulti2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "queryStrings",
        AlgebraicType.createArrayType(AlgebraicType.createStringType())
      ),
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType())
    ]);
  }
  SubscribeMulti2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    SubscribeMulti2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  SubscribeMulti2.serialize = serialize;
  function deserialize(reader) {
    return SubscribeMulti2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  SubscribeMulti2.deserialize = deserialize;
})(SubscribeMulti || (SubscribeMulti = {}));

// src/client_api/unsubscribe_type.ts
var Unsubscribe;
((Unsubscribe2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType())
    ]);
  }
  Unsubscribe2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    Unsubscribe2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  Unsubscribe2.serialize = serialize;
  function deserialize(reader) {
    return Unsubscribe2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  Unsubscribe2.deserialize = deserialize;
})(Unsubscribe || (Unsubscribe = {}));

// src/client_api/unsubscribe_multi_type.ts
var UnsubscribeMulti;
((UnsubscribeMulti2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType())
    ]);
  }
  UnsubscribeMulti2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    UnsubscribeMulti2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  UnsubscribeMulti2.serialize = serialize;
  function deserialize(reader) {
    return UnsubscribeMulti2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  UnsubscribeMulti2.deserialize = deserialize;
})(UnsubscribeMulti || (UnsubscribeMulti = {}));

// src/client_api/client_message_type.ts
var ClientMessage;
((ClientMessage2) => {
  ClientMessage2.CallReducer = (value) => ({
    tag: "CallReducer",
    value
  });
  ClientMessage2.Subscribe = (value) => ({
    tag: "Subscribe",
    value
  });
  ClientMessage2.OneOffQuery = (value) => ({
    tag: "OneOffQuery",
    value
  });
  ClientMessage2.SubscribeSingle = (value) => ({
    tag: "SubscribeSingle",
    value
  });
  ClientMessage2.SubscribeMulti = (value) => ({
    tag: "SubscribeMulti",
    value
  });
  ClientMessage2.Unsubscribe = (value) => ({
    tag: "Unsubscribe",
    value
  });
  ClientMessage2.UnsubscribeMulti = (value) => ({ tag: "UnsubscribeMulti", value });
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createSumType([
      new SumTypeVariant(
        "CallReducer",
        CallReducer.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant("Subscribe", Subscribe.getTypeScriptAlgebraicType()),
      new SumTypeVariant(
        "OneOffQuery",
        OneOffQuery.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "SubscribeSingle",
        SubscribeSingle.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "SubscribeMulti",
        SubscribeMulti.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "Unsubscribe",
        Unsubscribe.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "UnsubscribeMulti",
        UnsubscribeMulti.getTypeScriptAlgebraicType()
      )
    ]);
  }
  ClientMessage2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    ClientMessage2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  ClientMessage2.serialize = serialize;
  function deserialize(reader) {
    return ClientMessage2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  ClientMessage2.deserialize = deserialize;
})(ClientMessage || (ClientMessage = {}));

// src/client_api/query_update_type.ts
var QueryUpdate;
((QueryUpdate2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "deletes",
        BsatnRowList.getTypeScriptAlgebraicType()
      ),
      new ProductTypeElement(
        "inserts",
        BsatnRowList.getTypeScriptAlgebraicType()
      )
    ]);
  }
  QueryUpdate2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    QueryUpdate2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  QueryUpdate2.serialize = serialize;
  function deserialize(reader) {
    return QueryUpdate2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  QueryUpdate2.deserialize = deserialize;
})(QueryUpdate || (QueryUpdate = {}));

// src/client_api/compressable_query_update_type.ts
var CompressableQueryUpdate;
((CompressableQueryUpdate2) => {
  CompressableQueryUpdate2.Uncompressed = (value) => ({ tag: "Uncompressed", value });
  CompressableQueryUpdate2.Brotli = (value) => ({
    tag: "Brotli",
    value
  });
  CompressableQueryUpdate2.Gzip = (value) => ({
    tag: "Gzip",
    value
  });
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createSumType([
      new SumTypeVariant(
        "Uncompressed",
        QueryUpdate.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "Brotli",
        AlgebraicType.createArrayType(AlgebraicType.createU8Type())
      ),
      new SumTypeVariant(
        "Gzip",
        AlgebraicType.createArrayType(AlgebraicType.createU8Type())
      )
    ]);
  }
  CompressableQueryUpdate2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    CompressableQueryUpdate2.getTypeScriptAlgebraicType().serialize(
      writer,
      value
    );
  }
  CompressableQueryUpdate2.serialize = serialize;
  function deserialize(reader) {
    return CompressableQueryUpdate2.getTypeScriptAlgebraicType().deserialize(
      reader
    );
  }
  CompressableQueryUpdate2.deserialize = deserialize;
})(CompressableQueryUpdate || (CompressableQueryUpdate = {}));

// src/client_api/table_update_type.ts
var TableUpdate;
((TableUpdate2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("tableId", AlgebraicType.createU32Type()),
      new ProductTypeElement("tableName", AlgebraicType.createStringType()),
      new ProductTypeElement("numRows", AlgebraicType.createU64Type()),
      new ProductTypeElement(
        "updates",
        AlgebraicType.createArrayType(
          CompressableQueryUpdate.getTypeScriptAlgebraicType()
        )
      )
    ]);
  }
  TableUpdate2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    TableUpdate2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  TableUpdate2.serialize = serialize;
  function deserialize(reader) {
    return TableUpdate2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  TableUpdate2.deserialize = deserialize;
})(TableUpdate || (TableUpdate = {}));

// src/client_api/database_update_type.ts
var DatabaseUpdate;
((DatabaseUpdate2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "tables",
        AlgebraicType.createArrayType(
          TableUpdate.getTypeScriptAlgebraicType()
        )
      )
    ]);
  }
  DatabaseUpdate2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    DatabaseUpdate2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  DatabaseUpdate2.serialize = serialize;
  function deserialize(reader) {
    return DatabaseUpdate2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  DatabaseUpdate2.deserialize = deserialize;
})(DatabaseUpdate || (DatabaseUpdate = {}));

// src/client_api/energy_quanta_type.ts
var EnergyQuanta;
((EnergyQuanta2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("quanta", AlgebraicType.createU128Type())
    ]);
  }
  EnergyQuanta2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    EnergyQuanta2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  EnergyQuanta2.serialize = serialize;
  function deserialize(reader) {
    return EnergyQuanta2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  EnergyQuanta2.deserialize = deserialize;
})(EnergyQuanta || (EnergyQuanta = {}));

// src/client_api/identity_token_type.ts
var IdentityToken;
((IdentityToken2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("identity", AlgebraicType.createIdentityType()),
      new ProductTypeElement("token", AlgebraicType.createStringType()),
      new ProductTypeElement(
        "connectionId",
        AlgebraicType.createConnectionIdType()
      )
    ]);
  }
  IdentityToken2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    IdentityToken2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  IdentityToken2.serialize = serialize;
  function deserialize(reader) {
    return IdentityToken2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  IdentityToken2.deserialize = deserialize;
})(IdentityToken || (IdentityToken = {}));

// src/client_api/initial_subscription_type.ts
var InitialSubscription;
((InitialSubscription2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "databaseUpdate",
        DatabaseUpdate.getTypeScriptAlgebraicType()
      ),
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement(
        "totalHostExecutionDuration",
        AlgebraicType.createTimeDurationType()
      )
    ]);
  }
  InitialSubscription2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    InitialSubscription2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  InitialSubscription2.serialize = serialize;
  function deserialize(reader) {
    return InitialSubscription2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  InitialSubscription2.deserialize = deserialize;
})(InitialSubscription || (InitialSubscription = {}));

// src/client_api/one_off_table_type.ts
var OneOffTable;
((OneOffTable2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("tableName", AlgebraicType.createStringType()),
      new ProductTypeElement(
        "rows",
        BsatnRowList.getTypeScriptAlgebraicType()
      )
    ]);
  }
  OneOffTable2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    OneOffTable2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  OneOffTable2.serialize = serialize;
  function deserialize(reader) {
    return OneOffTable2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  OneOffTable2.deserialize = deserialize;
})(OneOffTable || (OneOffTable = {}));

// src/client_api/one_off_query_response_type.ts
var OneOffQueryResponse;
((OneOffQueryResponse2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "messageId",
        AlgebraicType.createArrayType(AlgebraicType.createU8Type())
      ),
      new ProductTypeElement(
        "error",
        AlgebraicType.createOptionType(AlgebraicType.createStringType())
      ),
      new ProductTypeElement(
        "tables",
        AlgebraicType.createArrayType(
          OneOffTable.getTypeScriptAlgebraicType()
        )
      ),
      new ProductTypeElement(
        "totalHostExecutionDuration",
        AlgebraicType.createTimeDurationType()
      )
    ]);
  }
  OneOffQueryResponse2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    OneOffQueryResponse2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  OneOffQueryResponse2.serialize = serialize;
  function deserialize(reader) {
    return OneOffQueryResponse2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  OneOffQueryResponse2.deserialize = deserialize;
})(OneOffQueryResponse || (OneOffQueryResponse = {}));

// src/client_api/reducer_call_info_type.ts
var ReducerCallInfo;
((ReducerCallInfo2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("reducerName", AlgebraicType.createStringType()),
      new ProductTypeElement("reducerId", AlgebraicType.createU32Type()),
      new ProductTypeElement(
        "args",
        AlgebraicType.createArrayType(AlgebraicType.createU8Type())
      ),
      new ProductTypeElement("requestId", AlgebraicType.createU32Type())
    ]);
  }
  ReducerCallInfo2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    ReducerCallInfo2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  ReducerCallInfo2.serialize = serialize;
  function deserialize(reader) {
    return ReducerCallInfo2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  ReducerCallInfo2.deserialize = deserialize;
})(ReducerCallInfo || (ReducerCallInfo = {}));

// src/client_api/update_status_type.ts
var UpdateStatus;
((UpdateStatus2) => {
  UpdateStatus2.Committed = (value) => ({
    tag: "Committed",
    value
  });
  UpdateStatus2.Failed = (value) => ({
    tag: "Failed",
    value
  });
  UpdateStatus2.OutOfEnergy = { tag: "OutOfEnergy" };
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createSumType([
      new SumTypeVariant(
        "Committed",
        DatabaseUpdate.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant("Failed", AlgebraicType.createStringType()),
      new SumTypeVariant("OutOfEnergy", AlgebraicType.createProductType([]))
    ]);
  }
  UpdateStatus2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    UpdateStatus2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  UpdateStatus2.serialize = serialize;
  function deserialize(reader) {
    return UpdateStatus2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  UpdateStatus2.deserialize = deserialize;
})(UpdateStatus || (UpdateStatus = {}));

// src/client_api/transaction_update_type.ts
var TransactionUpdate;
((TransactionUpdate2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "status",
        UpdateStatus.getTypeScriptAlgebraicType()
      ),
      new ProductTypeElement("timestamp", AlgebraicType.createTimestampType()),
      new ProductTypeElement(
        "callerIdentity",
        AlgebraicType.createIdentityType()
      ),
      new ProductTypeElement(
        "callerConnectionId",
        AlgebraicType.createConnectionIdType()
      ),
      new ProductTypeElement(
        "reducerCall",
        ReducerCallInfo.getTypeScriptAlgebraicType()
      ),
      new ProductTypeElement(
        "energyQuantaUsed",
        EnergyQuanta.getTypeScriptAlgebraicType()
      ),
      new ProductTypeElement(
        "totalHostExecutionDuration",
        AlgebraicType.createTimeDurationType()
      )
    ]);
  }
  TransactionUpdate2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    TransactionUpdate2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  TransactionUpdate2.serialize = serialize;
  function deserialize(reader) {
    return TransactionUpdate2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  TransactionUpdate2.deserialize = deserialize;
})(TransactionUpdate || (TransactionUpdate = {}));

// src/client_api/transaction_update_light_type.ts
var TransactionUpdateLight;
((TransactionUpdateLight2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement(
        "update",
        DatabaseUpdate.getTypeScriptAlgebraicType()
      )
    ]);
  }
  TransactionUpdateLight2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    TransactionUpdateLight2.getTypeScriptAlgebraicType().serialize(
      writer,
      value
    );
  }
  TransactionUpdateLight2.serialize = serialize;
  function deserialize(reader) {
    return TransactionUpdateLight2.getTypeScriptAlgebraicType().deserialize(
      reader
    );
  }
  TransactionUpdateLight2.deserialize = deserialize;
})(TransactionUpdateLight || (TransactionUpdateLight = {}));

// src/client_api/subscribe_rows_type.ts
var SubscribeRows;
((SubscribeRows2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("tableId", AlgebraicType.createU32Type()),
      new ProductTypeElement("tableName", AlgebraicType.createStringType()),
      new ProductTypeElement(
        "tableRows",
        TableUpdate.getTypeScriptAlgebraicType()
      )
    ]);
  }
  SubscribeRows2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    SubscribeRows2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  SubscribeRows2.serialize = serialize;
  function deserialize(reader) {
    return SubscribeRows2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  SubscribeRows2.deserialize = deserialize;
})(SubscribeRows || (SubscribeRows = {}));

// src/client_api/subscribe_applied_type.ts
var SubscribeApplied;
((SubscribeApplied2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement(
        "totalHostExecutionDurationMicros",
        AlgebraicType.createU64Type()
      ),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType()),
      new ProductTypeElement(
        "rows",
        SubscribeRows.getTypeScriptAlgebraicType()
      )
    ]);
  }
  SubscribeApplied2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    SubscribeApplied2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  SubscribeApplied2.serialize = serialize;
  function deserialize(reader) {
    return SubscribeApplied2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  SubscribeApplied2.deserialize = deserialize;
})(SubscribeApplied || (SubscribeApplied = {}));

// src/client_api/unsubscribe_applied_type.ts
var UnsubscribeApplied;
((UnsubscribeApplied2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement(
        "totalHostExecutionDurationMicros",
        AlgebraicType.createU64Type()
      ),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType()),
      new ProductTypeElement(
        "rows",
        SubscribeRows.getTypeScriptAlgebraicType()
      )
    ]);
  }
  UnsubscribeApplied2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    UnsubscribeApplied2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  UnsubscribeApplied2.serialize = serialize;
  function deserialize(reader) {
    return UnsubscribeApplied2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  UnsubscribeApplied2.deserialize = deserialize;
})(UnsubscribeApplied || (UnsubscribeApplied = {}));

// src/client_api/subscription_error_type.ts
var SubscriptionError;
((SubscriptionError2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement(
        "totalHostExecutionDurationMicros",
        AlgebraicType.createU64Type()
      ),
      new ProductTypeElement(
        "requestId",
        AlgebraicType.createOptionType(AlgebraicType.createU32Type())
      ),
      new ProductTypeElement(
        "queryId",
        AlgebraicType.createOptionType(AlgebraicType.createU32Type())
      ),
      new ProductTypeElement(
        "tableId",
        AlgebraicType.createOptionType(AlgebraicType.createU32Type())
      ),
      new ProductTypeElement("error", AlgebraicType.createStringType())
    ]);
  }
  SubscriptionError2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    SubscriptionError2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  SubscriptionError2.serialize = serialize;
  function deserialize(reader) {
    return SubscriptionError2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  SubscriptionError2.deserialize = deserialize;
})(SubscriptionError || (SubscriptionError = {}));

// src/client_api/subscribe_multi_applied_type.ts
var SubscribeMultiApplied;
((SubscribeMultiApplied2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement(
        "totalHostExecutionDurationMicros",
        AlgebraicType.createU64Type()
      ),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType()),
      new ProductTypeElement(
        "update",
        DatabaseUpdate.getTypeScriptAlgebraicType()
      )
    ]);
  }
  SubscribeMultiApplied2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    SubscribeMultiApplied2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  SubscribeMultiApplied2.serialize = serialize;
  function deserialize(reader) {
    return SubscribeMultiApplied2.getTypeScriptAlgebraicType().deserialize(
      reader
    );
  }
  SubscribeMultiApplied2.deserialize = deserialize;
})(SubscribeMultiApplied || (SubscribeMultiApplied = {}));

// src/client_api/unsubscribe_multi_applied_type.ts
var UnsubscribeMultiApplied;
((UnsubscribeMultiApplied2) => {
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createProductType([
      new ProductTypeElement("requestId", AlgebraicType.createU32Type()),
      new ProductTypeElement(
        "totalHostExecutionDurationMicros",
        AlgebraicType.createU64Type()
      ),
      new ProductTypeElement("queryId", QueryId.getTypeScriptAlgebraicType()),
      new ProductTypeElement(
        "update",
        DatabaseUpdate.getTypeScriptAlgebraicType()
      )
    ]);
  }
  UnsubscribeMultiApplied2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    UnsubscribeMultiApplied2.getTypeScriptAlgebraicType().serialize(
      writer,
      value
    );
  }
  UnsubscribeMultiApplied2.serialize = serialize;
  function deserialize(reader) {
    return UnsubscribeMultiApplied2.getTypeScriptAlgebraicType().deserialize(
      reader
    );
  }
  UnsubscribeMultiApplied2.deserialize = deserialize;
})(UnsubscribeMultiApplied || (UnsubscribeMultiApplied = {}));

// src/client_api/server_message_type.ts
var ServerMessage;
((ServerMessage2) => {
  ServerMessage2.InitialSubscription = (value) => ({ tag: "InitialSubscription", value });
  ServerMessage2.TransactionUpdate = (value) => ({ tag: "TransactionUpdate", value });
  ServerMessage2.TransactionUpdateLight = (value) => ({ tag: "TransactionUpdateLight", value });
  ServerMessage2.IdentityToken = (value) => ({
    tag: "IdentityToken",
    value
  });
  ServerMessage2.OneOffQueryResponse = (value) => ({ tag: "OneOffQueryResponse", value });
  ServerMessage2.SubscribeApplied = (value) => ({ tag: "SubscribeApplied", value });
  ServerMessage2.UnsubscribeApplied = (value) => ({ tag: "UnsubscribeApplied", value });
  ServerMessage2.SubscriptionError = (value) => ({ tag: "SubscriptionError", value });
  ServerMessage2.SubscribeMultiApplied = (value) => ({ tag: "SubscribeMultiApplied", value });
  ServerMessage2.UnsubscribeMultiApplied = (value) => ({ tag: "UnsubscribeMultiApplied", value });
  function getTypeScriptAlgebraicType() {
    return AlgebraicType.createSumType([
      new SumTypeVariant(
        "InitialSubscription",
        InitialSubscription.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "TransactionUpdate",
        TransactionUpdate.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "TransactionUpdateLight",
        TransactionUpdateLight.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "IdentityToken",
        IdentityToken.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "OneOffQueryResponse",
        OneOffQueryResponse.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "SubscribeApplied",
        SubscribeApplied.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "UnsubscribeApplied",
        UnsubscribeApplied.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "SubscriptionError",
        SubscriptionError.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "SubscribeMultiApplied",
        SubscribeMultiApplied.getTypeScriptAlgebraicType()
      ),
      new SumTypeVariant(
        "UnsubscribeMultiApplied",
        UnsubscribeMultiApplied.getTypeScriptAlgebraicType()
      )
    ]);
  }
  ServerMessage2.getTypeScriptAlgebraicType = getTypeScriptAlgebraicType;
  function serialize(writer, value) {
    ServerMessage2.getTypeScriptAlgebraicType().serialize(writer, value);
  }
  ServerMessage2.serialize = serialize;
  function deserialize(reader) {
    return ServerMessage2.getTypeScriptAlgebraicType().deserialize(reader);
  }
  ServerMessage2.deserialize = deserialize;
})(ServerMessage || (ServerMessage = {}));

// src/event_emitter.ts
var EventEmitter = class {
  #events = /* @__PURE__ */ new Map();
  on(event, callback) {
    let callbacks = this.#events.get(event);
    if (!callbacks) {
      callbacks = /* @__PURE__ */ new Set();
      this.#events.set(event, callbacks);
    }
    callbacks.add(callback);
  }
  off(event, callback) {
    let callbacks = this.#events.get(event);
    if (!callbacks) {
      return;
    }
    callbacks.delete(callback);
  }
  emit(event, ...args) {
    let callbacks = this.#events.get(event);
    if (!callbacks) {
      return;
    }
    for (let callback of callbacks) {
      callback(...args);
    }
  }
};

// src/operations_map.ts
var OperationsMap = class {
  #items = [];
  #isEqual(a, b) {
    if (a && typeof a === "object" && "isEqual" in a) {
      return a.isEqual(b);
    }
    return a === b;
  }
  set(key, value) {
    const existingIndex = this.#items.findIndex(
      ({ key: k }) => this.#isEqual(k, key)
    );
    if (existingIndex > -1) {
      this.#items[existingIndex].value = value;
    } else {
      this.#items.push({ key, value });
    }
  }
  get(key) {
    const item = this.#items.find(({ key: k }) => this.#isEqual(k, key));
    return item ? item.value : void 0;
  }
  delete(key) {
    const existingIndex = this.#items.findIndex(
      ({ key: k }) => this.#isEqual(k, key)
    );
    if (existingIndex > -1) {
      this.#items.splice(existingIndex, 1);
      return true;
    }
    return false;
  }
  has(key) {
    return this.#items.some(({ key: k }) => this.#isEqual(k, key));
  }
  values() {
    return this.#items.map((i) => i.value);
  }
  entries() {
    return this.#items;
  }
  [Symbol.iterator]() {
    let index = 0;
    const items = this.#items;
    return {
      next() {
        if (index < items.length) {
          return { value: items[index++], done: false };
        } else {
          return { value: null, done: true };
        }
      }
    };
  }
};

// src/logger.ts
var LogLevelIdentifierIcon = {
  component: "\u{1F4E6}",
  info: "\u2139\uFE0F",
  warn: "\u26A0\uFE0F",
  error: "\u274C",
  debug: "\u{1F41B}"
};
var LogStyle = {
  component: "color: #fff; background-color: #8D6FDD; padding: 2px 5px; border-radius: 3px;",
  info: "color: #fff; background-color: #007bff; padding: 2px 5px; border-radius: 3px;",
  warn: "color: #fff; background-color: #ffc107; padding: 2px 5px; border-radius: 3px;",
  error: "color: #fff; background-color: #dc3545; padding: 2px 5px; border-radius: 3px;",
  debug: "color: #fff; background-color: #28a745; padding: 2px 5px; border-radius: 3px;"
};
var LogTextStyle = {
  component: "color: #8D6FDD;",
  info: "color: #007bff;",
  warn: "color: #ffc107;",
  error: "color: #dc3545;",
  debug: "color: #28a745;"
};
var stdbLogger = (level, message) => {
  console.log(
    `%c${LogLevelIdentifierIcon[level]} ${level.toUpperCase()}%c ${message}`,
    LogStyle[level],
    LogTextStyle[level]
  );
};

// src/table_cache.ts
var TableCache33 = class {
  rows;
  tableTypeInfo;
  emitter;
  /**
   * @param name the table name
   * @param primaryKeyCol column index designated as `#[primarykey]`
   * @param primaryKey column name designated as `#[primarykey]`
   * @param entityClass the entityClass
   */
  constructor(tableTypeInfo) {
    this.tableTypeInfo = tableTypeInfo;
    this.rows = /* @__PURE__ */ new Map();
    this.emitter = new EventEmitter();
  }
  /**
   * @returns number of rows in the table
   */
  count() {
    return this.rows.size;
  }
  /**
   * @returns The values of the rows in the table
   */
  iter() {
    return Array.from(this.rows.values()).map(([row]) => row);
  }
  applyOperations = (operations, ctx) => {
    const pendingCallbacks = [];
    if (this.tableTypeInfo.primaryKey !== void 0) {
      const primaryKey = this.tableTypeInfo.primaryKey;
      const insertMap = new OperationsMap();
      const deleteMap = new OperationsMap();
      for (const op of operations) {
        if (op.type === "insert") {
          const [_, prevCount] = insertMap.get(op.row[primaryKey]) || [op, 0];
          insertMap.set(op.row[primaryKey], [op, prevCount + 1]);
        } else {
          const [_, prevCount] = deleteMap.get(op.row[primaryKey]) || [op, 0];
          deleteMap.set(op.row[primaryKey], [op, prevCount + 1]);
        }
      }
      for (const {
        key: primaryKey2,
        value: [insertOp, refCount]
      } of insertMap) {
        const deleteEntry = deleteMap.get(primaryKey2);
        if (deleteEntry) {
          const [deleteOp, deleteCount] = deleteEntry;
          const refCountDelta = refCount - deleteCount;
          const maybeCb = this.update(ctx, insertOp, deleteOp, refCountDelta);
          if (maybeCb) {
            pendingCallbacks.push(maybeCb);
          }
          deleteMap.delete(primaryKey2);
        } else {
          const maybeCb = this.insert(ctx, insertOp, refCount);
          if (maybeCb) {
            pendingCallbacks.push(maybeCb);
          }
        }
      }
      for (const [deleteOp, refCount] of deleteMap.values()) {
        const maybeCb = this.delete(ctx, deleteOp, refCount);
        if (maybeCb) {
          pendingCallbacks.push(maybeCb);
        }
      }
    } else {
      for (const op of operations) {
        if (op.type === "insert") {
          const maybeCb = this.insert(ctx, op);
          if (maybeCb) {
            pendingCallbacks.push(maybeCb);
          }
        } else {
          const maybeCb = this.delete(ctx, op);
          if (maybeCb) {
            pendingCallbacks.push(maybeCb);
          }
        }
      }
    }
    return pendingCallbacks;
  };
  update = (ctx, newDbOp, oldDbOp, refCountDelta = 0) => {
    const [oldRow, previousCount] = this.rows.get(oldDbOp.rowId) || [
      oldDbOp.row,
      0
    ];
    const refCount = Math.max(1, previousCount + refCountDelta);
    this.rows.delete(oldDbOp.rowId);
    this.rows.set(newDbOp.rowId, [newDbOp.row, refCount]);
    if (previousCount === 0) {
      stdbLogger("error", "Updating a row that was not present in the cache");
      return {
        type: "insert",
        table: this.tableTypeInfo.tableName,
        cb: () => {
          this.emitter.emit("insert", ctx, newDbOp.row);
        }
      };
    } else if (previousCount + refCountDelta <= 0) {
      stdbLogger("error", "Negative reference count for row");
    }
    return {
      type: "update",
      table: this.tableTypeInfo.tableName,
      cb: () => {
        this.emitter.emit("update", ctx, oldRow, newDbOp.row);
      }
    };
  };
  insert = (ctx, operation, count = 1) => {
    const [_, previousCount] = this.rows.get(operation.rowId) || [
      operation.row,
      0
    ];
    this.rows.set(operation.rowId, [operation.row, previousCount + count]);
    if (previousCount === 0) {
      return {
        type: "insert",
        table: this.tableTypeInfo.tableName,
        cb: () => {
          this.emitter.emit("insert", ctx, operation.row);
        }
      };
    }
    return void 0;
  };
  delete = (ctx, operation, count = 1) => {
    const [_, previousCount] = this.rows.get(operation.rowId) || [
      operation.row,
      0
    ];
    if (previousCount === 0) {
      stdbLogger("warn", "Deleting a row that was not present in the cache");
      return void 0;
    }
    if (previousCount <= count) {
      this.rows.delete(operation.rowId);
      return {
        type: "delete",
        table: this.tableTypeInfo.tableName,
        cb: () => {
          this.emitter.emit("delete", ctx, operation.row);
        }
      };
    }
    this.rows.set(operation.rowId, [operation.row, previousCount - count]);
    return void 0;
  };
  /**
   * Register a callback for when a row is newly inserted into the database.
   *
   * ```ts
   * User.onInsert((user, reducerEvent) => {
   *   if (reducerEvent) {
   *      console.log("New user on reducer", reducerEvent, user);
   *   } else {
   *      console.log("New user received during subscription update on insert", user);
   *  }
   * });
   * ```
   *
   * @param cb Callback to be called when a new row is inserted
   */
  onInsert = (cb) => {
    this.emitter.on("insert", cb);
  };
  /**
   * Register a callback for when a row is deleted from the database.
   *
   * ```ts
   * User.onDelete((user, reducerEvent) => {
   *   if (reducerEvent) {
   *      console.log("Deleted user on reducer", reducerEvent, user);
   *   } else {
   *      console.log("Deleted user received during subscription update on update", user);
   *  }
   * });
   * ```
   *
   * @param cb Callback to be called when a new row is inserted
   */
  onDelete = (cb) => {
    this.emitter.on("delete", cb);
  };
  /**
   * Register a callback for when a row is updated into the database.
   *
   * ```ts
   * User.onInsert((user, reducerEvent) => {
   *   if (reducerEvent) {
   *      console.log("Updated user on reducer", reducerEvent, user);
   *   } else {
   *      console.log("Updated user received during subscription update on delete", user);
   *  }
   * });
   * ```
   *
   * @param cb Callback to be called when a new row is inserted
   */
  onUpdate = (cb) => {
    this.emitter.on("update", cb);
  };
  /**
   * Remove a callback for when a row is newly inserted into the database.
   *
   * @param cb Callback to be removed
   */
  removeOnInsert = (cb) => {
    this.emitter.off("insert", cb);
  };
  /**
   * Remove a callback for when a row is deleted from the database.
   *
   * @param cb Callback to be removed
   */
  removeOnDelete = (cb) => {
    this.emitter.off("delete", cb);
  };
  /**
   * Remove a callback for when a row is updated into the database.
   *
   * @param cb Callback to be removed
   */
  removeOnUpdate = (cb) => {
    this.emitter.off("update", cb);
  };
};

// src/client_cache.ts
var ClientCache = class {
  /**
   * The tables in the database.
   */
  tables;
  constructor() {
    this.tables = /* @__PURE__ */ new Map();
  }
  /**
   * Returns the table with the given name.
   * @param name The name of the table.
   * @returns The table
   */
  getTable(name) {
    const table = this.tables.get(name);
    if (!table) {
      console.error(
        "The table has not been registered for this client. Please register the table before using it. If you have registered global tables using the SpacetimeDBClient.registerTables() or `registerTable()` method, please make sure that is executed first!"
      );
      throw new Error(`Table ${name} does not exist`);
    }
    return table;
  }
  getOrCreateTable(tableTypeInfo) {
    let table;
    if (!this.tables.has(tableTypeInfo.tableName)) {
      table = new TableCache33(tableTypeInfo);
      this.tables.set(tableTypeInfo.tableName, table);
    } else {
      table = this.tables.get(tableTypeInfo.tableName);
    }
    return table;
  }
};

// src/decompress.ts
async function decompress(buffer, type, chunkSize = 128 * 1024) {
  let offset = 0;
  const readableStream = new ReadableStream({
    pull(controller) {
      if (offset < buffer.length) {
        const chunk = buffer.subarray(
          offset,
          Math.min(offset + chunkSize, buffer.length)
        );
        controller.enqueue(chunk);
        offset += chunkSize;
      } else {
        controller.close();
      }
    }
  });
  const decompressionStream = new DecompressionStream(type);
  const decompressedStream = readableStream.pipeThrough(decompressionStream);
  const reader = decompressedStream.getReader();
  const chunks = [];
  let totalLength = 0;
  let result;
  while (!(result = await reader.read()).done) {
    chunks.push(result.value);
    totalLength += result.value.length;
  }
  const decompressedArray = new Uint8Array(totalLength);
  let chunkOffset = 0;
  for (const chunk of chunks) {
    decompressedArray.set(chunk, chunkOffset);
    chunkOffset += chunk.length;
  }
  return decompressedArray;
}

// src/websocket_decompress_adapter.ts
var WebsocketDecompressAdapter = class _WebsocketDecompressAdapter {
  onclose;
  onopen;
  onmessage;
  onerror;
  #ws;
  async #handleOnMessage(msg) {
    const buffer = new Uint8Array(msg.data);
    let decompressed;
    if (buffer[0] === 0) {
      decompressed = buffer.slice(1);
    } else if (buffer[0] === 1) {
      throw new Error(
        "Brotli Compression not supported. Please use gzip or none compression in withCompression method on DbConnection."
      );
    } else if (buffer[0] === 2) {
      decompressed = await decompress(buffer.slice(1), "gzip");
    } else {
      throw new Error(
        "Unexpected Compression Algorithm. Please use `gzip` or `none`"
      );
    }
    this.onmessage?.({ data: decompressed });
  }
  #handleOnOpen(msg) {
    this.onopen?.(msg);
  }
  #handleOnError(msg) {
    this.onerror?.(msg);
  }
  send(msg) {
    this.#ws.send(msg);
  }
  close() {
    this.#ws.close();
  }
  constructor(ws) {
    this.onmessage = void 0;
    this.onopen = void 0;
    this.onmessage = void 0;
    this.onerror = void 0;
    ws.onmessage = this.#handleOnMessage.bind(this);
    ws.onerror = this.#handleOnError.bind(this);
    ws.onclose = this.#handleOnError.bind(this);
    ws.onopen = this.#handleOnOpen.bind(this);
    ws.binaryType = "arraybuffer";
    this.#ws = ws;
  }
  static async createWebSocketFn({
    url,
    wsProtocol,
    authToken,
    compression,
    lightMode
  }) {
    const headers = new Headers();
    let WS;
    {
      WS = WebSocket;
    }
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
      const tokenUrl = new URL("/v1/identity/websocket-token", url);
      tokenUrl.protocol = url.protocol === "wss:" ? "https:" : "http:";
      const response = await fetch(tokenUrl, { method: "POST", headers });
      if (response.ok) {
        const { token } = await response.json();
        url.searchParams.set("token", token);
      }
    }
    url.searchParams.set(
      "compression",
      compression === "gzip" ? "Gzip" : "None"
    );
    if (lightMode) {
      url.searchParams.set("light", "true");
    }
    const ws = new WS(url, wsProtocol);
    return new _WebsocketDecompressAdapter(ws);
  }
};

// src/db_connection_builder.ts
var DbConnectionBuilder32 = class {
  /**
   * Creates a new `DbConnectionBuilder` database client and set the initial parameters.
   *
   * Users are not expected to call this constructor directly. Instead, use the static method `DbConnection.builder()`.
   *
   * @param remoteModule The remote module to use to connect to the SpacetimeDB server.
   * @param dbConnectionConstructor The constructor to use to create a new `DbConnection`.
   */
  constructor(remoteModule, dbConnectionConstructor) {
    this.remoteModule = remoteModule;
    this.dbConnectionConstructor = dbConnectionConstructor;
    this.#createWSFn = WebsocketDecompressAdapter.createWebSocketFn;
  }
  #uri;
  #nameOrAddress;
  #identity;
  #token;
  #emitter = new EventEmitter();
  #compression = "gzip";
  #lightMode = false;
  #createWSFn;
  /**
   * Set the URI of the SpacetimeDB server to connect to.
   *
   * @param uri The URI of the SpacetimeDB server to connect to.
   *
   **/
  withUri(uri) {
    this.#uri = new URL(uri);
    return this;
  }
  /**
   * Set the name or Identity of the database module to connect to.
   *
   * @param nameOrAddress
   *
   * @returns The `DbConnectionBuilder` instance.
   */
  withModuleName(nameOrAddress) {
    this.#nameOrAddress = nameOrAddress;
    return this;
  }
  /**
   * Set the identity of the client to connect to the database.
   *
   * @param token The credentials to use to authenticate with SpacetimeDB. This
   * is optional. You can store the token returned by the `onConnect` callback
   * to use in future connections.
   *
   * @returns The `DbConnectionBuilder` instance.
   */
  withToken(token) {
    this.#token = token;
    return this;
  }
  withWSFn(createWSFn) {
    this.#createWSFn = createWSFn;
    return this;
  }
  /**
   * Set the compression algorithm to use for the connection.
   *
   * @param compression The compression algorithm to use for the connection.
   */
  withCompression(compression) {
    this.#compression = compression;
    return this;
  }
  /**
   * Sets the connection to operate in light mode.
   *
   * Light mode is a mode that reduces the amount of data sent over the network.
   *
   * @param lightMode The light mode for the connection.
   */
  withLightMode(lightMode) {
    this.#lightMode = lightMode;
    return this;
  }
  /**
   * Register a callback to be invoked upon authentication with the database.
   *
   * @param identity A unique identifier for a client connected to a database.
   * @param token The credentials to use to authenticate with SpacetimeDB.
   *
   * @returns The `DbConnectionBuilder` instance.
   *
   * The callback will be invoked with the `Identity` and private authentication `token` provided by the database to identify this connection.
   *
   * If credentials were supplied to connect, those passed to the callback will be equivalent to the ones used to connect.
   *
   * If the initial connection was anonymous, a new set of credentials will be generated by the database to identify this user.
   *
   * The credentials passed to the callback can be saved and used to authenticate the same user in future connections.
   *
   * @example
   *
   * ```ts
   * DbConnection.builder().onConnect((ctx, identity, token) => {
   *  console.log("Connected to SpacetimeDB with identity:", identity.toHexString());
   * });
   * ```
   */
  onConnect(callback) {
    this.#emitter.on("connect", callback);
    return this;
  }
  /**
   * Register a callback to be invoked upon an error.
   *
   * @example
   *
   * ```ts
   * DbConnection.builder().onConnectError((ctx, error) => {
   *   console.log("Error connecting to SpacetimeDB:", error);
   * });
   * ```
   */
  onConnectError(callback) {
    this.#emitter.on("connectError", callback);
    return this;
  }
  /**
   * Registers a callback to run when a {@link DbConnection} whose connection initially succeeded
   * is disconnected, either after a {@link DbConnection.disconnect} call or due to an error.
   *
   * If the connection ended because of an error, the error is passed to the callback.
   *
   * The `callback` will be installed on the `DbConnection` created by `build`
   * before initiating the connection, ensuring there's no opportunity for the disconnect to happen
   * before the callback is installed.
   *
   * Note that this does not trigger if `build` fails
   * or in cases where {@link DbConnectionBuilder.onConnectError} would trigger.
   * This callback only triggers if the connection closes after `build` returns successfully
   * and {@link DbConnectionBuilder.onConnect} is invoked, i.e., after the `IdentityToken` is received.
   *
   * To simplify SDK implementation, at most one such callback can be registered.
   * Calling `onDisconnect` on the same `DbConnectionBuilder` multiple times throws an error.
   *
   * Unlike callbacks registered via {@link DbConnection},
   * no mechanism is provided to unregister the provided callback.
   * This is a concession to ergonomics; there's no clean place to return a `CallbackId` from this method
   * or from `build`.
   *
   * @param {function(error?: Error): void} callback - The callback to invoke upon disconnection.
   * @throws {Error} Throws an error if called multiple times on the same `DbConnectionBuilder`.
   */
  onDisconnect(callback) {
    this.#emitter.on("disconnect", callback);
    return this;
  }
  /**
   * Builds a new `DbConnection` with the parameters set on this `DbConnectionBuilder` and attempts to connect to the SpacetimeDB server.
   *
   * @returns A new `DbConnection` with the parameters set on this `DbConnectionBuilder`.
   *
   * @example
   *
   * ```ts
   * const host = "http://localhost:3000";
   * const name_or_address = "database_name"
   * const auth_token = undefined;
   * DbConnection.builder().withUri(host).withModuleName(name_or_address).withToken(auth_token).build();
   * ```
   */
  build() {
    if (!this.#uri) {
      throw new Error("URI is required to connect to SpacetimeDB");
    }
    if (!this.#nameOrAddress) {
      throw new Error(
        "Database name or address is required to connect to SpacetimeDB"
      );
    }
    return this.dbConnectionConstructor(
      new DbConnectionImpl32({
        uri: this.#uri,
        nameOrAddress: this.#nameOrAddress,
        identity: this.#identity,
        token: this.#token,
        emitter: this.#emitter,
        compression: this.#compression,
        lightMode: this.#lightMode,
        createWSFn: this.#createWSFn,
        remoteModule: this.remoteModule
      })
    );
  }
};

// src/subscription_builder_impl.ts
var SubscriptionBuilderImpl32 = class {
  constructor(db) {
    this.db = db;
  }
  #onApplied = void 0;
  #onError = void 0;
  /**
   * Registers `callback` to run when this query is successfully added to our subscribed set,
   * I.e. when its `SubscriptionApplied` message is received.
   *
   * The database state exposed via the `&EventContext` argument
   * includes all the rows added to the client cache as a result of the new subscription.
   *
   * The event in the `&EventContext` argument is `Event::SubscribeApplied`.
   *
   * Multiple `on_applied` callbacks for the same query may coexist.
   * No mechanism for un-registering `on_applied` callbacks is exposed.
   *
   * @param cb - Callback to run when the subscription is applied.
   * @returns The current `SubscriptionBuilder` instance.
   */
  onApplied(cb) {
    this.#onApplied = cb;
    return this;
  }
  /**
   * Registers `callback` to run when this query either:
   * - Fails to be added to our subscribed set.
   * - Is unexpectedly removed from our subscribed set.
   *
   * If the subscription had previously started and has been unexpectedly removed,
   * the database state exposed via the `&EventContext` argument contains no rows
   * from any subscriptions removed within the same error event.
   * As proposed, it must therefore contain no rows.
   *
   * The event in the `&EventContext` argument is `Event::SubscribeError`,
   * containing a dynamic error object with a human-readable description of the error
   * for diagnostic purposes.
   *
   * Multiple `on_error` callbacks for the same query may coexist.
   * No mechanism for un-registering `on_error` callbacks is exposed.
   *
   * @param cb - Callback to run when there is an error in subscription.
   * @returns The current `SubscriptionBuilder` instance.
   */
  onError(cb) {
    this.#onError = cb;
    return this;
  }
  /**
   * Subscribe to a single query. The results of the query will be merged into the client
   * cache and deduplicated on the client.
   *
   * @param query_sql A `SQL` query to subscribe to.
   *
   * @example
   *
   * ```ts
   * const subscription = connection.subscriptionBuilder().onApplied(() => {
   *   console.log("SDK client cache initialized.");
   * }).subscribe("SELECT * FROM User");
   *
   * subscription.unsubscribe();
   * ```
   */
  subscribe(query_sql) {
    const queries = Array.isArray(query_sql) ? query_sql : [query_sql];
    if (queries.length === 0) {
      throw new Error("Subscriptions must have at least one query");
    }
    return new SubscriptionHandleImpl(
      this.db,
      queries,
      this.#onApplied,
      this.#onError
    );
  }
  /**
   * Subscribes to all rows from all tables.
   *
   * This method is intended as a convenience
   * for applications where client-side memory use and network bandwidth are not concerns.
   * Applications where these resources are a constraint
   * should register more precise queries via `subscribe`
   * in order to replicate only the subset of data which the client needs to function.
   *
   * This method should not be combined with `subscribe` on the same `DbConnection`.
   * A connection may either `subscribe` to particular queries,
   * or `subscribeToAllTables`, but not both.
   * Attempting to call `subscribe`
   * on a `DbConnection` that has previously used `subscribeToAllTables`,
   * or vice versa, may misbehave in any number of ways,
   * including dropping subscriptions, corrupting the client cache, or throwing errors.
   */
  subscribeToAllTables() {
    this.subscribe("SELECT * FROM *");
  }
};
var SubscriptionManager = class {
  subscriptions = /* @__PURE__ */ new Map();
};
var SubscriptionHandleImpl = class {
  constructor(db, querySql, onApplied, onError) {
    this.db = db;
    this.#emitter.on(
      "applied",
      (ctx) => {
        this.#activeState = true;
        if (onApplied) {
          onApplied(ctx);
        }
      }
    );
    this.#emitter.on(
      "error",
      (ctx, error) => {
        this.#activeState = false;
        this.#endedState = true;
        if (onError) {
          onError(ctx, error);
        }
      }
    );
    this.#queryId = this.db.registerSubscription(this, this.#emitter, querySql);
  }
  #queryId;
  #unsubscribeCalled = false;
  #endedState = false;
  #activeState = false;
  #emitter = new EventEmitter();
  /**
   * Consumes self and issues an `Unsubscribe` message,
   * removing this query from the client's set of subscribed queries.
   * It is only valid to call this method if `is_active()` is `true`.
   */
  unsubscribe() {
    if (this.#unsubscribeCalled) {
      throw new Error("Unsubscribe has already been called");
    }
    this.#unsubscribeCalled = true;
    this.db.unregisterSubscription(this.#queryId);
    this.#emitter.on(
      "end",
      (_ctx) => {
        this.#endedState = true;
        this.#activeState = false;
      }
    );
  }
  /**
   * Unsubscribes and also registers a callback to run upon success.
   * I.e. when an `UnsubscribeApplied` message is received.
   *
   * If `Unsubscribe` returns an error,
   * or if the `on_error` callback(s) are invoked before this subscription would end normally,
   * the `on_end` callback is not invoked.
   *
   * @param onEnd - Callback to run upon successful unsubscribe.
   */
  unsubscribeThen(onEnd) {
    if (this.#endedState) {
      throw new Error("Subscription has already ended");
    }
    if (this.#unsubscribeCalled) {
      throw new Error("Unsubscribe has already been called");
    }
    this.#unsubscribeCalled = true;
    this.db.unregisterSubscription(this.#queryId);
    this.#emitter.on(
      "end",
      (ctx) => {
        this.#endedState = true;
        this.#activeState = false;
        onEnd(ctx);
      }
    );
  }
  /**
   * True if this `SubscriptionHandle` has ended,
   * either due to an error or a call to `unsubscribe`.
   *
   * This is initially false, and becomes true when either the `on_end` or `on_error` callback is invoked.
   * A subscription which has not yet been applied is not active, but is also not ended.
   */
  isEnded() {
    return this.#endedState;
  }
  /**
   * True if this `SubscriptionHandle` is active, meaning it has been successfully applied
   * and has not since ended, either due to an error or a complete `unsubscribe` request-response pair.
   *
   * This corresponds exactly to the interval bounded at the start by the `on_applied` callback
   * and at the end by either the `on_end` or `on_error` callback.
   */
  isActive() {
    return this.#activeState;
  }
};

// src/db_connection_impl.ts
function callReducerFlagsToNumber(flags) {
  switch (flags) {
    case "FullUpdate":
      return 0;
    case "NoSuccessNotify":
      return 1;
  }
}
var DbConnectionImpl32 = class {
  /**
   * Whether or not the connection is active.
   */
  isActive = false;
  /**
   * This connection's public identity.
   */
  identity = void 0;
  /**
   * This connection's private authentication token.
   */
  token = void 0;
  /**
   * The accessor field to access the tables in the database and associated
   * callback functions.
   */
  db;
  /**
   * The accessor field to access the reducers in the database and associated
   * callback functions.
   */
  reducers;
  /**
   * The accessor field to access functions related to setting flags on
   * reducers regarding how the server should handle the reducer call and
   * the events that it sends back to the client.
   */
  setReducerFlags;
  /**
   * The `ConnectionId` of the connection to to the database.
   */
  connectionId = ConnectionId.random();
  // These fields are meant to be strictly private.
  #queryId = 0;
  #emitter;
  #reducerEmitter = new EventEmitter();
  #onApplied;
  #remoteModule;
  #messageQueue = Promise.resolve();
  #subscriptionManager = new SubscriptionManager();
  // These fields are not part of the public API, but in a pinch you
  // could use JavaScript to access them by bypassing TypeScript's
  // private fields.
  // We use them in testing.
  clientCache;
  ws;
  wsPromise;
  constructor({
    uri,
    nameOrAddress,
    identity,
    token,
    emitter,
    remoteModule,
    createWSFn,
    compression,
    lightMode
  }) {
    stdbLogger("info", "Connecting to SpacetimeDB WS...");
    let url = new URL(`v1/database/${nameOrAddress}/subscribe`, uri);
    if (!/^wss?:/.test(uri.protocol)) {
      url.protocol = "ws:";
    }
    this.identity = identity;
    this.token = token;
    this.#remoteModule = remoteModule;
    this.#emitter = emitter;
    let connectionId = this.connectionId.toHexString();
    url.searchParams.set("connection_id", connectionId);
    this.clientCache = new ClientCache();
    this.db = this.#remoteModule.dbViewConstructor(this);
    this.setReducerFlags = this.#remoteModule.setReducerFlagsConstructor();
    this.reducers = this.#remoteModule.reducersConstructor(
      this,
      this.setReducerFlags
    );
    this.wsPromise = createWSFn({
      url,
      wsProtocol: "v1.bsatn.spacetimedb",
      authToken: token,
      compression,
      lightMode
    }).then((v) => {
      this.ws = v;
      this.ws.onclose = () => {
        this.#emitter.emit("disconnect", this);
      };
      this.ws.onerror = (e) => {
        this.#emitter.emit("connectError", this, e);
      };
      this.ws.onopen = this.#handleOnOpen.bind(this);
      this.ws.onmessage = this.#handleOnMessage.bind(this);
      return v;
    }).catch((e) => {
      stdbLogger("error", "Error connecting to SpacetimeDB WS");
      this.#on("connectError", e);
      throw e;
    });
  }
  #getNextQueryId = () => {
    const queryId = this.#queryId;
    this.#queryId += 1;
    return queryId;
  };
  // NOTE: This is very important!!! This is the actual function that
  // gets called when you call `connection.subscriptionBuilder()`.
  // The `subscriptionBuilder` function which is generated, just shadows
  // this function in the type system, but not the actual implementation!
  // Do not remove this function, or shoot yourself in the foot please.
  // It's not clear what would be a better way to do this at this exact
  // moment.
  subscriptionBuilder = () => {
    return new SubscriptionBuilderImpl32(this);
  };
  registerSubscription(handle, handleEmitter, querySql) {
    const queryId = this.#getNextQueryId();
    this.#subscriptionManager.subscriptions.set(queryId, {
      handle,
      emitter: handleEmitter
    });
    this.#sendMessage(
      ClientMessage.SubscribeMulti({
        queryStrings: querySql,
        queryId: { id: queryId },
        // The TypeScript SDK doesn't currently track `request_id`s,
        // so always use 0.
        requestId: 0
      })
    );
    return queryId;
  }
  unregisterSubscription(queryId) {
    this.#sendMessage(
      ClientMessage.UnsubscribeMulti({
        queryId: { id: queryId },
        // The TypeScript SDK doesn't currently track `request_id`s,
        // so always use 0.
        requestId: 0
      })
    );
  }
  // This function is async because we decompress the message async
  async #processParsedMessage(message) {
    const parseRowList = (type, tableName, rowList) => {
      const buffer = rowList.rowsData;
      const reader = new BinaryReader(buffer);
      const rows = [];
      const rowType = this.#remoteModule.tables[tableName].rowType;
      while (reader.offset < buffer.length + buffer.byteOffset) {
        const row = rowType.deserialize(reader);
        const rowId = JSON.stringify(
          row,
          (_, v) => typeof v === "bigint" ? v.toString() : v
        );
        rows.push({
          type,
          rowId,
          row
        });
      }
      return rows;
    };
    const parseTableUpdate = async (rawTableUpdate) => {
      const tableName = rawTableUpdate.tableName;
      let operations = [];
      for (const update of rawTableUpdate.updates) {
        let decompressed;
        if (update.tag === "Gzip") {
          const decompressedBuffer = await decompress(update.value, "gzip");
          decompressed = QueryUpdate.deserialize(
            new BinaryReader(decompressedBuffer)
          );
        } else if (update.tag === "Brotli") {
          throw new Error(
            "Brotli compression not supported. Please use gzip or none compression in withCompression method on DbConnection."
          );
        } else {
          decompressed = update.value;
        }
        operations = operations.concat(
          parseRowList("insert", tableName, decompressed.inserts)
        );
        operations = operations.concat(
          parseRowList("delete", tableName, decompressed.deletes)
        );
      }
      return {
        tableName,
        operations
      };
    };
    const parseDatabaseUpdate = async (dbUpdate) => {
      const tableUpdates = [];
      for (const rawTableUpdate of dbUpdate.tables) {
        tableUpdates.push(await parseTableUpdate(rawTableUpdate));
      }
      return tableUpdates;
    };
    switch (message.tag) {
      case "InitialSubscription": {
        const dbUpdate = message.value.databaseUpdate;
        const tableUpdates = await parseDatabaseUpdate(dbUpdate);
        const subscriptionUpdate = {
          tag: "InitialSubscription",
          tableUpdates
        };
        return subscriptionUpdate;
      }
      case "TransactionUpdateLight": {
        const dbUpdate = message.value.update;
        const tableUpdates = await parseDatabaseUpdate(dbUpdate);
        const subscriptionUpdate = {
          tag: "TransactionUpdateLight",
          tableUpdates
        };
        return subscriptionUpdate;
      }
      case "TransactionUpdate": {
        const txUpdate = message.value;
        const identity = txUpdate.callerIdentity;
        const connectionId = ConnectionId.nullIfZero(
          txUpdate.callerConnectionId
        );
        const reducerName = txUpdate.reducerCall.reducerName;
        const args = txUpdate.reducerCall.args;
        const energyQuantaUsed = txUpdate.energyQuantaUsed;
        let tableUpdates;
        let errMessage = "";
        switch (txUpdate.status.tag) {
          case "Committed":
            tableUpdates = await parseDatabaseUpdate(txUpdate.status.value);
            break;
          case "Failed":
            tableUpdates = [];
            errMessage = txUpdate.status.value;
            break;
          case "OutOfEnergy":
            tableUpdates = [];
            break;
        }
        if (reducerName === "<none>") {
          let errorMessage = errMessage;
          console.error(`Received an error from the database: ${errorMessage}`);
          return;
        }
        let reducerInfo;
        if (reducerName !== "") {
          reducerInfo = {
            reducerName,
            args
          };
        }
        const transactionUpdate = {
          tag: "TransactionUpdate",
          tableUpdates,
          identity,
          connectionId,
          reducerInfo,
          status: txUpdate.status,
          energyConsumed: energyQuantaUsed.quanta,
          message: errMessage,
          timestamp: txUpdate.timestamp
        };
        return transactionUpdate;
      }
      case "IdentityToken": {
        const identityTokenMessage = {
          tag: "IdentityToken",
          identity: message.value.identity,
          token: message.value.token,
          connectionId: message.value.connectionId
        };
        return identityTokenMessage;
      }
      case "OneOffQueryResponse": {
        throw new Error(
          `TypeScript SDK never sends one-off queries, but got OneOffQueryResponse ${message}`
        );
      }
      case "SubscribeMultiApplied": {
        const parsedTableUpdates = await parseDatabaseUpdate(
          message.value.update
        );
        const subscribeAppliedMessage = {
          tag: "SubscribeApplied",
          queryId: message.value.queryId.id,
          tableUpdates: parsedTableUpdates
        };
        return subscribeAppliedMessage;
      }
      case "UnsubscribeMultiApplied": {
        const parsedTableUpdates = await parseDatabaseUpdate(
          message.value.update
        );
        const unsubscribeAppliedMessage = {
          tag: "UnsubscribeApplied",
          queryId: message.value.queryId.id,
          tableUpdates: parsedTableUpdates
        };
        return unsubscribeAppliedMessage;
      }
      case "SubscriptionError": {
        return {
          tag: "SubscriptionError",
          queryId: message.value.queryId,
          error: message.value.error
        };
      }
    }
  }
  #sendMessage(message) {
    this.wsPromise.then((wsResolved) => {
      const writer = new BinaryWriter(1024);
      ClientMessage.serialize(writer, message);
      const encoded = writer.getBuffer();
      wsResolved.send(encoded);
    });
  }
  /**
   * Handles WebSocket onOpen event.
   */
  #handleOnOpen() {
    this.isActive = true;
  }
  #applyTableUpdates(tableUpdates, eventContext) {
    const pendingCallbacks = [];
    for (let tableUpdate of tableUpdates) {
      const tableName = tableUpdate.tableName;
      const tableTypeInfo = this.#remoteModule.tables[tableName];
      const table = this.clientCache.getOrCreateTable(tableTypeInfo);
      pendingCallbacks.push(
        ...table.applyOperations(tableUpdate.operations, eventContext)
      );
    }
    return pendingCallbacks;
  }
  async #processMessage(data) {
    const serverMessage = parseValue(ServerMessage, data);
    const message = await this.#processParsedMessage(serverMessage);
    if (!message) {
      return;
    }
    switch (message.tag) {
      case "InitialSubscription": {
        let event = { tag: "SubscribeApplied" };
        const eventContext = this.#remoteModule.eventContextConstructor(
          this,
          event
        );
        const { event: _, ...subscriptionEventContext } = eventContext;
        const callbacks = this.#applyTableUpdates(
          message.tableUpdates,
          eventContext
        );
        if (this.#emitter) {
          this.#onApplied?.(subscriptionEventContext);
        }
        for (const callback of callbacks) {
          callback.cb();
        }
        break;
      }
      case "TransactionUpdateLight": {
        let event = { tag: "UnknownTransaction" };
        const eventContext = this.#remoteModule.eventContextConstructor(
          this,
          event
        );
        const callbacks = this.#applyTableUpdates(
          message.tableUpdates,
          eventContext
        );
        for (const callback of callbacks) {
          callback.cb();
        }
        break;
      }
      case "TransactionUpdate": {
        let reducerInfo = message.reducerInfo;
        let unknownTransaction = false;
        let reducerArgs;
        let reducerTypeInfo;
        if (!reducerInfo) {
          unknownTransaction = true;
        } else {
          reducerTypeInfo = this.#remoteModule.reducers[reducerInfo.reducerName];
          try {
            const reader = new BinaryReader(reducerInfo.args);
            reducerArgs = reducerTypeInfo.argsType.deserialize(reader);
          } catch {
            console.debug("Failed to deserialize reducer arguments");
            unknownTransaction = true;
          }
        }
        if (unknownTransaction) {
          const event2 = { tag: "UnknownTransaction" };
          const eventContext2 = this.#remoteModule.eventContextConstructor(
            this,
            event2
          );
          const callbacks2 = this.#applyTableUpdates(
            message.tableUpdates,
            eventContext2
          );
          for (const callback of callbacks2) {
            callback.cb();
          }
          return;
        }
        reducerInfo = reducerInfo;
        reducerTypeInfo = reducerTypeInfo;
        const reducerEvent = {
          callerIdentity: message.identity,
          status: message.status,
          callerConnectionId: message.connectionId,
          timestamp: message.timestamp,
          energyConsumed: message.energyConsumed,
          reducer: {
            name: reducerInfo.reducerName,
            args: reducerArgs
          }
        };
        const event = {
          tag: "Reducer",
          value: reducerEvent
        };
        const eventContext = this.#remoteModule.eventContextConstructor(
          this,
          event
        );
        const reducerEventContext = {
          ...eventContext,
          event: reducerEvent
        };
        const callbacks = this.#applyTableUpdates(
          message.tableUpdates,
          eventContext
        );
        const argsArray = [];
        reducerTypeInfo.argsType.product.elements.forEach((element, index) => {
          argsArray.push(reducerArgs[element.name]);
        });
        this.#reducerEmitter.emit(
          reducerInfo.reducerName,
          reducerEventContext,
          ...argsArray
        );
        for (const callback of callbacks) {
          callback.cb();
        }
        break;
      }
      case "IdentityToken": {
        this.identity = message.identity;
        if (!this.token && message.token) {
          this.token = message.token;
        }
        this.connectionId = message.connectionId;
        this.#emitter.emit("connect", this, this.identity, this.token);
        break;
      }
      case "SubscribeApplied": {
        const subscription = this.#subscriptionManager.subscriptions.get(
          message.queryId
        );
        if (subscription === void 0) {
          stdbLogger(
            "error",
            `Received SubscribeApplied for unknown queryId ${message.queryId}.`
          );
          break;
        }
        const event = { tag: "SubscribeApplied" };
        const eventContext = this.#remoteModule.eventContextConstructor(
          this,
          event
        );
        const { event: _, ...subscriptionEventContext } = eventContext;
        const callbacks = this.#applyTableUpdates(
          message.tableUpdates,
          eventContext
        );
        subscription?.emitter.emit("applied", subscriptionEventContext);
        for (const callback of callbacks) {
          callback.cb();
        }
        break;
      }
      case "UnsubscribeApplied": {
        const subscription = this.#subscriptionManager.subscriptions.get(
          message.queryId
        );
        if (subscription === void 0) {
          stdbLogger(
            "error",
            `Received UnsubscribeApplied for unknown queryId ${message.queryId}.`
          );
          break;
        }
        const event = { tag: "UnsubscribeApplied" };
        const eventContext = this.#remoteModule.eventContextConstructor(
          this,
          event
        );
        const { event: _, ...subscriptionEventContext } = eventContext;
        const callbacks = this.#applyTableUpdates(
          message.tableUpdates,
          eventContext
        );
        subscription?.emitter.emit("end", subscriptionEventContext);
        this.#subscriptionManager.subscriptions.delete(message.queryId);
        for (const callback of callbacks) {
          callback.cb();
        }
        break;
      }
      case "SubscriptionError": {
        const error = Error(message.error);
        const event = { tag: "Error", value: error };
        const eventContext = this.#remoteModule.eventContextConstructor(
          this,
          event
        );
        const errorContext = {
          ...eventContext,
          event: error
        };
        if (message.queryId !== void 0) {
          this.#subscriptionManager.subscriptions.get(message.queryId)?.emitter.emit("error", errorContext, error);
          this.#subscriptionManager.subscriptions.delete(message.queryId);
        } else {
          console.error("Received an error message without a queryId: ", error);
          this.#subscriptionManager.subscriptions.forEach(({ emitter }) => {
            emitter.emit("error", errorContext, error);
          });
        }
      }
    }
  }
  /**
   * Handles WebSocket onMessage event.
   * @param wsMessage MessageEvent object.
   */
  #handleOnMessage(wsMessage) {
    this.#messageQueue = this.#messageQueue.then(() => {
      return this.#processMessage(wsMessage.data);
    });
  }
  /**
   * Call a reducer on your SpacetimeDB module.
   *
   * @param reducerName The name of the reducer to call
   * @param argsSerializer The arguments to pass to the reducer
   */
  callReducer(reducerName, argsBuffer, flags) {
    const message = ClientMessage.CallReducer({
      reducer: reducerName,
      args: argsBuffer,
      // The TypeScript SDK doesn't currently track `request_id`s,
      // so always use 0.
      requestId: 0,
      flags: callReducerFlagsToNumber(flags)
    });
    this.#sendMessage(message);
  }
  /**
   * Close the current connection.
   *
   * @example
   *
   * ```ts
   * const connection = DbConnection.builder().build();
   * connection.disconnect()
   * ```
   */
  disconnect() {
    this.wsPromise.then((wsResolved) => {
      wsResolved.close();
    });
  }
  #on(eventName, callback) {
    this.#emitter.on(eventName, callback);
  }
  #off(eventName, callback) {
    this.#emitter.off(eventName, callback);
  }
  #onConnect(callback) {
    this.#emitter.on("connect", callback);
  }
  #onDisconnect(callback) {
    this.#emitter.on("disconnect", callback);
  }
  #onConnectError(callback) {
    this.#emitter.on("connectError", callback);
  }
  #removeOnConnect(callback) {
    this.#emitter.off("connect", callback);
  }
  #removeOnDisconnect(callback) {
    this.#emitter.off("disconnect", callback);
  }
  #removeOnConnectError(callback) {
    this.#emitter.off("connectError", callback);
  }
  // Note: This is required to be public because it needs to be
  // called from the `RemoteReducers` class.
  onReducer(reducerName, callback) {
    this.#reducerEmitter.on(reducerName, callback);
  }
  // Note: This is required to be public because it needs to be
  // called from the `RemoteReducers` class.
  offReducer(reducerName, callback) {
    this.#reducerEmitter.off(reducerName, callback);
  }
};

export { AlgebraicType, AlgebraicValue, BinaryReader, BinaryWriter, ClientCache, ConnectionId, DbConnectionBuilder32 as DbConnectionBuilder, DbConnectionImpl32 as DbConnectionImpl, Identity, ProductType, ProductTypeElement, ProductValue, ScheduleAt, SubscriptionBuilderImpl32 as SubscriptionBuilderImpl, SumType, SumTypeVariant, TableCache33 as TableCache, TimeDuration, Timestamp, deepEqual };
